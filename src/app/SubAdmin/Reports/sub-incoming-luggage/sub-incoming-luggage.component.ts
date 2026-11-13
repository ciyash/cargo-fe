import { CommonModule } from '@angular/common';
import { Component,ElementRef,ViewChild } from '@angular/core';
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
  selector: 'app-sub-incoming-luggage',
  templateUrl: './sub-incoming-luggage.component.html',
  styleUrls: ['./sub-incoming-luggage.component.scss']
})
export class SubIncomingLuggageComponent {
    @ViewChild('selectElem') selectElem!: ElementRef;
    @ViewChild('pickupbranch') pickupbranch!: ElementRef;
    @ViewChild('selectElem2') selectElem2!: ElementRef;
    @ViewChild('droupbranch') droupbranch!: ElementRef;


    onPickupBranchSelect: any;
    onDropBranchSelect: any;
      form!: FormGroup;
      reportData: any;
      citydata: any;
      branchdata: any;
      allgetvechicle: any;
      pfdata: any;
      today = new Date();
      payload: any;
    pdata: any;
    tbcdata: any;
  fromCityValue: any;
  filteredCityList: any;
      constructor(private api: BranchService, private fb: FormBuilder,private router:Router,private toast:ToastrService) {
        this.form = this.fb.group({
          // fromDate: ['', Validators.required],
          // toDate: ['', Validators.required],
          fromDate: [this.getTodayDateString(), Validators.required],
          toDate: [this.getTodayDateString(), Validators.required],
          fromCity: [''],
          toCity: [''],
          pickUpBranch: [''],
          dropBranch: [''],
        });
      }

      getTodayDateString(): string {
        const today = new Date();
        const day = ('0' + today.getDate()).slice(-2);
        const month = ('0' + (today.getMonth() + 1)).slice(-2);
        const year = today.getFullYear();
        return `${year}-${month}-${day}`; // Ã¢Å“â€ HTML date input format
      }


      ngOnInit() {
        // Fetch cities
        this.api.GetCities().subscribe((res: any) => {

          this.citydata = res;
          this.getProfileData();
        });

        // Fetch branches

        this.api.GetBranch().subscribe((res: any) => {
          this.branchdata = res;

        });


        // Fetch vehicles
        this.api.VehicleData().subscribe((res: any) => {

          this.allgetvechicle = res;
        });
        this.getProfileData();
      }

  // hh
      LuaggageReport() {
        this.payload = {
          fromDate: this.form.value.fromDate,
          toDate: this.form.value.toDate,
          fromCity: this.form.value.fromCity,
          toCity: this.form.value.toCity,
          pickUpBranch: this.form.value.pickUpBranch,
          dropBranch: this.form.value.dropBranch,
        };


        this.api.ParcelIncomingReport(this.payload).subscribe(
          (res: any) => {
            this.reportData = res.data;

            const  ddsts = res.data

            const finalData = {
              ...this.reportData,
              fromDate: this.payload.fromDate,
              toDate: this.payload.toDate
            };

            // Save to localStorage
            localStorage.setItem('incomingReportData', JSON.stringify(finalData));

            // Open new tab
            window.open('/parcelincomingreport', '_blank');
          },
          (error) => {
            console.error('API Error:', error);
          }
        );
      }



    getProfileData() {
      this.api.GetProfileData().subscribe((res: any) => {
        this.fromCityValue = res.branchId.city;

        this.filteredCityList = this.citydata.filter(
          (city: { cityName: any }) => city.cityName === this.fromCityValue
        );
        this.pfdata = res;


        this.form.patchValue({ fromCity: this.fromCityValue });

        // Trigger form change logic if needed
        this.onFromcitySelect({ target: { value: this.fromCityValue } });
          setTimeout(() => {
          // Update first select2
          $(this.selectElem.nativeElement).select2();
          $(this.selectElem.nativeElement).val(this.fromCityValue).trigger('change');
          $(this.selectElem.nativeElement).prop('disabled', true).trigger('change.select2')
        }, 0);
      });
    }

      ngAfterViewInit(): void {
        setTimeout(() => {
          // From City
          $(this.selectElem.nativeElement).select2();
          $(this.selectElem.nativeElement).val('all').trigger('change'); // Ã¢Å“â€¦ force default
          $(this.selectElem.nativeElement).on('select2:select', (event: any) => {
            const selectedCity = event.params.data.id;
            this.form.patchValue({ fromCity: selectedCity });
            this.onFromcitySelect({ target: { value: selectedCity } });
          });

          // Pickup Branch
          $(this.pickupbranch.nativeElement).select2();
          $(this.pickupbranch.nativeElement).val('all').trigger('change'); // Ã¢Å“â€¦
          $(this.pickupbranch.nativeElement).on('select2:select', (event: any) => {
            const selectedBranch = event.params.data.id;
            this.form.patchValue({ pickUpBranch: selectedBranch });
            this.onPickupBranchSelect({ target: { value: selectedBranch } });

          });

          // To City
          $(this.selectElem2.nativeElement).select2();
          $(this.selectElem2.nativeElement).val('all').trigger('change'); // Ã¢Å“â€¦
          $(this.selectElem2.nativeElement).on('select2:select', (event: any) => {
            const selectedToCity = event.params.data.id;
            this.form.patchValue({ toCity: selectedToCity });
            this.onTocitySelect({ target: { value: selectedToCity } });
          });

          // Drop Branch
          $(this.droupbranch.nativeElement).select2();
          $(this.droupbranch.nativeElement).val('all').trigger('change'); // Ã¢Å“â€¦
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
  }
