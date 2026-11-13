import { DomesticPhoneDirective } from '../../shared/domestic-phone.directive';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../USER/header/header.component';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BranchService } from 'src/app/service/branch.service';
import { AdminService } from 'src/app/service/admin.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  standalone: true,
  imports: [DomesticPhoneDirective, CommonModule, FormsModule, ReactiveFormsModule, RouterModule, HeaderComponent],
  selector: 'app-parcel-delivery',
  templateUrl: './parcel-delivery.component.html',
  styleUrls: ['./parcel-delivery.component.scss']
})
export class ParcelDeliveryComponent {
  searchTerm: string = '';
  searchResult: any[] = [];
  data2: any[] = [];
  idselectmsg: string = '';
  regname: any[] = [];
  errorMessage: string = '';
  updata: any;
  form: FormGroup;
  form2: FormGroup;
  employee: any;
  branchdata: any;
  citydata: any;
  pfdata: any;
  showReceiptToPrint = false;
  saving = false;

  constructor(
    private api: BranchService,
    private activeroute: ActivatedRoute,
    private fb: FormBuilder,
    private router: Router,
    private admin: AdminService,
    private toast: ToastrService
  ) {
    this.form = this.fb.group({
      grnNo: ['', Validators.required],
    });

    this.form2 = this.fb.group({
      grnNo: ['', Validators.required],
      receiverName: ['', Validators.required],
      receiverMobile: ['', [Validators.required, Validators.pattern(/^\+?\d{7,15}$/)]],
      toPayDeliveredAmount: [0, [Validators.required, Validators.min(0)]],
      lrNumber: [''],
    });
  }

  ngOnInit(): void {
    this.activeroute.queryParams.subscribe(params => {
      const grn = params['grn'];
      if (grn) {
        this.searchTerm = grn;
        this.form2.patchValue({ grnNo: grn });
        this.searchUser();
      }
    });

    this.api.GetCities().subscribe((res: any) => {
      this.citydata = res;
    });

    this.api.GetBranch().subscribe((res: any) => {
      this.branchdata = res;
    });

    this.getProfileData();
  }

  searchUser(): void {
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      this.api.GetGRNnumber(this.searchTerm.trim()).subscribe(
        (res: any) => {
          console.log("data:",res);


          if (res && res.booking) {
            this.data2 = [res.booking];
            this.form2.patchValue({grnNo:res.booking.grnNo,receiverName:res.booking.receiverName,receiverMobile:res.booking.receiverMobile,toPayDeliveredAmount:res.booking.bookingType === 'toPay' ? res.booking.grandTotal : 0});
            this.errorMessage = '';
          } else {
            this.data2 = [];
            this.errorMessage = 'No results found for the given search term.';
          }
        },
        (err: any) => {
          this.errorMessage = err.error?.message || 'An error occurred while searching.';
          this.data2 = [];
        }
      );
    } else {
      this.errorMessage = 'Please enter a valid search term.';
      this.data2 = [];
    }
  }

  GetAllEmployee() {
    this.admin.GetEmployees().subscribe({
      next: (res) => {
        this.employee = res;
        console.log("emolyee:",this.employee);

      },
      error: (err) => {
        this.errorMessage = 'Failed to fetch employee data.';
      },
    });
  }

  updateParcelStatus() {
    this.form2.markAllAsTouched();
    if (this.saving || this.form2.invalid) return;
    const row=this.data2[0];
    const due=row?.bookingType==='toPay'?Number(row.grandTotal):0;
    if (!row || row.bookingStatus!==2 || Math.abs(Number(this.form2.value.toPayDeliveredAmount)-due)>0.001) { this.toast.warning('Confirm the full To Pay amount before delivery; other freight types collect zero'); return; }
    this.saving=true;
    const payload = {
      grnNo: this.form2.value.grnNo,
      receiverName: this.form2.value.receiverName,
      receiverMobile: this.form2.value.receiverMobile,
      toPayDeliveredAmount: Number(this.form2.value.toPayDeliveredAmount),
    };

    this.api.ReceivedParcelUpdate(payload).subscribe(
      (res: any) => {
        this.saving=false;
        this.updata = res;
        this.toast.success(res.message || 'Parcel status updated successfully', 'Success');
        this.searchUser(); // Refresh data
      },
      (error) => {
        this.saving=false;
        const errMsg = error.error?.message || 'Failed to update parcel status';
        this.toast.error(errMsg, 'Error');
      }
    );
  }

  onFromcitySelect(event: any) {
    const selectedCity = event.target.value;
    if (selectedCity) {
      this.api.GetBranchbyCity(selectedCity).subscribe(
        (res: any) => {
          this.branchdata = res;
        },
        (error: any) => {
          console.error('Error fetching branches:', error);
        }
      );
    }
  }

  getProfileData() {
    this.api.GetProfileData().subscribe((res: any) => {
      this.pfdata = res;
    });
  }



  printReceipt() {
    this.showReceiptToPrint = true;

    setTimeout(() => {
      const printContents = document.getElementById('printSection')?.innerHTML;
      const originalContents = document.body.innerHTML;

      if (printContents) {
        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
        location.reload(); // Reset Angular bindings
      }
    }, 100);
  }
}
