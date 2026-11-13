import { CommonModule } from '@angular/common';
import {
Component,
ElementRef,
ViewChild
} from '@angular/core';
import { FormBuilder,FormGroup,FormsModule,ReactiveFormsModule,Validators } from '@angular/forms';
import { Router,RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BranchService } from 'src/app/service/branch.service';
import { HeaderComponent } from '../../../USER/header/header.component';
declare var $: any;
@Component({
  host: {'class':'reports-page'},

  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, HeaderComponent],
  selector: 'app-pendingdelivery-stock',
  templateUrl: './pendingdelivery-stock.component.html',
  styleUrls: ['./pendingdelivery-stock.component.scss']
})
export class PendingdeliveryStockComponent {




    @ViewChild('selectElem') selectElem!: ElementRef;
    @ViewChild('pickupbranch') pickupbranch!: ElementRef;
    @ViewChild('selectElem2') selectElem2!: ElementRef;
    @ViewChild('droupbranch') droupbranch!: ElementRef;
    form: FormGroup;
    citydata: any;
    branchdata: any;
    pfdata: any;
    gstdata: any;
    pdata: any;
    tbcdata: any;
    onPickupBranchSelect: any;
    onDropBranchSelect: any;
  ffdata: any;
  profileData: any;
    constructor(
      private fb: FormBuilder,
      private api: BranchService,
      private router: Router,
      private toast :ToastrService
    ) {
      this.form = this.fb.group({
        fromDate: [this.getTodayDateString(), Validators.required],
        toDate: [this.getTodayDateString(), Validators.required],
        fromCity: ['all', Validators.required],
        toCity: ['all', Validators.required],
        pickUpBranch: ['all', Validators.required],
        dropBranch: ['all', Validators.required],
      });

    }

    ngOnInit() {
      this.getProfileData();
      this.api.GetCities().subscribe((res: any) => {
        this.citydata = res;

      });

      this.api.GetBranch().subscribe((res: any) => {
        this.branchdata = res;

      });
    }

    getTodayDateString(): string {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    ngAfterViewInit(): void {
      setTimeout(() => {
        // From City


        // Pickup Branch


        // To City
        $(this.selectElem2.nativeElement).select2();
        $(this.selectElem2.nativeElement).val('all').trigger('change'); // âœ…
        $(this.selectElem2.nativeElement).on('select2:select', (event: any) => {
          const selectedToCity = event.params.data.id;
          this.form.patchValue({ toCity: selectedToCity });
          this.onTocitySelect({ target: { value: selectedToCity } });
        });

        // Drop Branch
        $(this.droupbranch.nativeElement).select2();
        $(this.droupbranch.nativeElement).val('all').trigger('change'); // âœ…
        $(this.droupbranch.nativeElement).on('select2:select', (event: any) => {
          const selectedDropBranch = event.params.data.id;
          this.form.patchValue({ dropBranch: selectedDropBranch });
          this.onDropBranchSelect({ target: { value: selectedDropBranch } });
        });
      }, 0);
    }

    onFromcitySelect(event: any) {
      const cityName = event.target.value;
      if (cityName) {
        this.api.GetBranchbyCity(cityName).subscribe(
          (res: any) => {

            this.pdata = res;
          },
          (error: any) => {
            console.error('Error fetching branches:', error);
          }
        );
      } else {
        this.pdata = [];
      }
    }

    onTocitySelect(event: any) {


      const cityName = event.target.value;
      if (cityName) {
        this.api.GetBranchbyCity(cityName).subscribe(
          (res: any) => {


            this.tbcdata = res;
          },
          (error: any) => {
            console.error('Error fetching branches:', error);
          }
        );
      } else {
        this.tbcdata = [];
      }
    }



    DeliveryStockReport() {
      const payload = this.form.value;

      this.api.PendingDeliveryStockReport(payload).subscribe({
        next: (res: any) => {


          const message = res?.message || 'Report fetched successfully';
          this.toast.success(message);

          this.gstdata = res;


          // Save data to localStorage
          localStorage.setItem('gstData', JSON.stringify(this.gstdata));

          // Open new tab
          window.open('/devliveryreport', '_blank');
        },
        error: (err: any) => {
          console.error('Error fetching report:', err);
          const errorMessage = err?.error?.message || err?.message || 'Failed to fetch report';
          this.toast.error(errorMessage);
        },
      });
    }

    getProfileData() {
      this.api.GetProfileData().subscribe((res: any) => {

        this.ffdata = res.branchId;
        this.pfdata = res.branchId.city;
        this.profileData = res;


        // Update form controls with profile data
        this.form.patchValue({
          fromCity: this.pfdata || '', // Set fromCity to the city from branchId
          pickUpBranch: this.ffdata?.branchUniqueId || '' // Set pickUpBranch to branchUniqueId
        });
          });
    }
  }
