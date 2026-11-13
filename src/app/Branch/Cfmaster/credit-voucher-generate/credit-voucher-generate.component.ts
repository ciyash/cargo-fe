import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../../USER/header/header.component';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BranchService } from 'src/app/service/branch.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, HeaderComponent],
  selector: 'app-credit-voucher-generate',
  templateUrl: './credit-voucher-generate.component.html',
  styleUrls: ['./credit-voucher-generate.component.scss']
})
export class CreditVoucherGenerateComponent {
  form:FormGroup;
  vldata:any[] = [];
  selected = new Set<number>();
  generating = false;
  get selectedTotal(): number { return this.vldata.filter(row => this.selected.has(Number(row.grnNo))).reduce((sum, row) => sum + Number(row.grandTotal || 0), 0); }
  toggleBooking(grn: number): void { const value = Number(grn); this.selected.has(value) ? this.selected.delete(value) : this.selected.add(value); }
  selectAll(checked: boolean): void { this.selected = checked ? new Set(this.vldata.map(row => Number(row.grnNo))) : new Set(); }
  userList: any[] = [];
  showDropdown:boolean=true;
  searchTerm: string = '';
  loading:boolean=true;
  form1:FormGroup;
  constructor(private api:BranchService, private fb:FormBuilder, private toast:ToastrService, private router:Router){
     this.form = this.fb.group({
      fromDate: [this.getTodayDateString(), Validators.required],
      toDate: [this.getTodayDateString(), Validators.required],
      senderName: [''],
          });

          this.form1 = this.fb.group({
            fromDate: ['', ],
            toDate: ['', ],
            grnNo: ['', ],
            creditForAgent: ['', ],
            fromBranch: ['', ],
            toBranch: ['', ],
            consignor: ['', ],
            bookingStatus: ['', ],
            charge: ['', ],
                });
  }

  ngOnInit(){

  }
  getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = ('0' + (today.getMonth() + 1)).slice(-2);
    const day = ('0' + today.getDate()).slice(-2);
    return `${year}-${month}-${day}`; // yyyy-MM-dd
  }

  VoucherLoad() {
    if (this.form.invalid || this.form.value.fromDate > this.form.value.toDate) { this.toast.warning('Select a valid date range'); return; }
    this.selected.clear();
    this.vldata = [];
    const payload = {
      fromDate: this.form.value.fromDate,
      toDate: this.form.value.toDate,
      senderName: this.form.value.senderName,
    };

    console.log('Final Payload:', payload);

    this.api.LoadVouchers(payload).subscribe({
      next: (response: any) => {
        console.log('Parcel loaded successfully:', response);
        this.toast.success('Vouchers loaded successfully','Success');
        this.vldata=Array.isArray(response) ? response : (response?.data || []);

        if (this.vldata.length > 0) {
          this.form1.patchValue({
            fromDate: this.form.value.fromDate,
            toDate: this.form.value.toDate,
            grnNo: this.vldata[0]?.grnNo,
            creditForAgent: this.vldata[0]?.senderName,
            fromBranch: this.vldata[0]?.pickUpBranchname,
            toBranch:this.vldata[0]?.dropBranchname,
            consignor: this.vldata[0]?.senderName,
            bookingStatus: this.vldata[0]?.bookingStatus,
            charge: this.vldata[0]?.grandTotal,

          });

        }

      },
      error: (error: any) => {
        console.error('Parcel loading failed:', error);
        this.toast.error('Parcel Loading Failed. Please try again', 'Error')

      },
    });
  }

  VoucherGenerate() {
    if (this.generating || !this.selected.size) { if (!this.generating) this.toast.warning('Select bookings for the statement'); return; }
    this.generating = true;
    const grns = [...this.selected];
    this.api.VoucherGenerate({grnNo: grns}).subscribe({
      next: () => {
        this.toast.success('Credit statement generated', 'Success');
        this.vldata = this.vldata.filter(row => !this.selected.has(Number(row.grnNo)));
        this.selected.clear();
        this.generating = false;
      },
      error: (error: any) => {
        this.generating = false;
        this.toast.error(error?.error?.message || 'Statement could not be generated', 'Error');
      }
    });
  }

  searchUser(): void {
    const searchTerm = this.form.get('senderName')?.value?.trim();
    if (searchTerm) {
      this.api.searchCfUser(searchTerm).subscribe(
        (res: any) => {
          console.log('API Response:', res);
          this.userList = res.data.length ? res.data : [];
          this.showDropdown = !!this.userList.length;
        },
        (err: any) => {
          console.error('Search Error:', err);
          this.userList = [];
          this.showDropdown = false;
        }
      );
    } else {
      this.userList = [];
      this.showDropdown = false;
    }
  }

  selectUser(user: any): void {
    this.form.patchValue({
      senderName: user.name,
      senderMobile: user.phone,
      senderAddress: user.address,
      senderGST: user.gst
    });
    this.showDropdown = false;
  }

  hideDropdown(): void {
    setTimeout(() => {
      this.showDropdown = false;
    }, 200); // Small delay to allow selection click
  }


}
