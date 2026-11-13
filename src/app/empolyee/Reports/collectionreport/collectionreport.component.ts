import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
  selector: 'app-collectionreport',
  templateUrl: './collectionreport.component.html',
  styleUrls: ['./collectionreport.component.scss']
})
export class CollectionreportComponent {

    form: FormGroup;
    citydata: any;
    branchdata: any;
    pfdata: any;
    collectiondata: any;
    pdata: any;
    onPickupBranchSelect:any;
  ffdata: any;
  profileData: any;
    constructor(private fb: FormBuilder, private api: BranchService, private router: Router,private toast:ToastrService) {
      this.form = this.fb.group({
        fromDate: [this.getTodayDateString(), Validators.required],
        toDate: [this.getTodayDateString(), Validators.required],
        fromCity: [''],
        pickUpBranch: [''],
        bookedBy: [''],
        reportType: ['']
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

    getProfileData() {
      this.api.GetProfileData().subscribe((res: any) => {

        this.ffdata = res.branchId;
        this.citydata = res;

        this.pfdata = res.branchId.city;
        this.profileData = res;


        // Update form controls with profile data
        this.form.patchValue({
          fromCity: this.pfdata || '', // Set fromCity to the city from branchId
          pickUpBranch: this.ffdata?.branchUniqueId || '' // Set pickUpBranch to branchUniqueId
        });

        // Fetch service charges after setting fromCity
      });
    }







    getCollectionReport() {
      const payload = this.form.value;


      this.api.ParcelBranchWiseReport(payload).subscribe({
        next: (res: any) => {
          const successMsg = res?.message || 'Report fetched successfully';
          this.toast.success(successMsg);
          const finalData = {
            ...res,
            fromDate: payload.fromDate,
            toDate: payload.toDate
          };
          const dataStr = encodeURIComponent(JSON.stringify(finalData));
                  const url = this.router.serializeUrl(
            this.router.createUrlTree(['/collectiondata'], {
              queryParams: { data: dataStr }
            })
          );
          window.open(url, '_blank');


        },

        error: (err: any) => {
          console.error('Error fetching report:', err);
          const errorMsg = err?.error?.message || err?.message || 'Failed to fetch report';
          this.toast.error(errorMsg);
        }
      });
  }

  }
