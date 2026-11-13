import { DomesticPhoneDirective } from '../../shared/domestic-phone.directive';
import { NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../USER/header/header.component';
import { ParcelLoadingDataComponent } from '../parcel-loading-data/parcel-loading-data.component';
import { RippleModule } from 'primeng/ripple';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import {  OnInit,AfterViewInit, Component, ElementRef, ViewChild  } from '@angular/core';
import type * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { BranchService } from 'src/app/service/branch.service';
import { TokenService } from 'src/app/service/token.service';
import { MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { Toast } from 'primeng/toast';
import { ToastrService } from 'ngx-toastr';
declare var $: any;
declare const SlimSelect: any;
@Component({
  standalone: true,
  imports: [DomesticPhoneDirective, CommonModule, FormsModule, ReactiveFormsModule, RouterModule, HeaderComponent, ParcelLoadingDataComponent, RippleModule, ZXingScannerModule],
  selector: 'app-parcelloading',
  templateUrl: './parcelloading.component.html',
  styleUrls: ['./parcelloading.component.scss'],
})
export class ParcelloadingComponent implements OnInit {
  adminData: any;
  form!: FormGroup;
  form1:FormGroup;
  cities:any;
  vehicle: any = {};
  branchdata:any;
  data:any;
  searchTerm: string = '';       // For binding with input field
  idselectmsg: string = '';
  errorMessage: string = '';
  data2:any;
  data1:any;
  LoadSuccess: boolean = false;
  allSelected: boolean = true;
  qrdata: string = '';
  showScanner: boolean = false;
  tbcdata:any;
   @ViewChild('selectElem') selectElem!: ElementRef;
   @ViewChild('branchselect') branchselect!: ElementRef;
   @ViewChild('SelectVechicle')SelectVechicle!:ElementRef;
  @ViewChild('demoSelect') demoSelect!: ElementRef;
  @ViewChild('printTable') printTable!: ElementRef;

  BranchSelect: any;
  pfdata: any;


  constructor(private api: BranchService, private token:TokenService,
     private fb: FormBuilder, private messageService:MessageService,
      private router:Router, private activeroute:ActivatedRoute,private toast:ToastrService, private zone:NgZone) {
      this.form = this.fb.group({
        startDate: [this.getTodayDateString(), Validators.required],
        endDate: [this.getTodayDateString(), Validators.required],
        fromCity: ['',Validators.required],
        toCity: this.fb.array([]),
        pickUpBranch: ['',Validators.required],
      });

      this.form1 = this.fb.group({
        loadingType: ['offload'],
        fromBranch: ['', ],
        toBranch: ['',],
        vehicalNumber: ['', Validators.required],
        driverName: ['', [Validators.required, Validators.minLength(3)]],
        driverNo: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
        fromBookingDate: ['',],
        toBookingDate: ['', ],
        fromCity:[''],
        // userName:['Test'],
        senderName:['',],
        toCity: this.fb.array([], ),
        grnNo: this.fb.array([], ),
        lrNumber: this.fb.array([], ),
      });


  }
  ngOnInit() {
    this.form.get('fromCity')?.valueChanges.subscribe(city=>this.onFromcitySelect({target:{value:city}}));
    this.form.get('pickUpBranch')?.valueChanges.subscribe(()=>this.clearOriginParcels());
    this.searchTerm = this.activeroute.snapshot.params['grnNo'];
    this.adminData = this.token.getToken();
    
    this.getCities();
    this. getVehicleData();
    this.branchData();
    this.getProfileData();
  }

  getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = ('0' + (today.getMonth() + 1)).slice(-2);
    const day = ('0' + today.getDate()).slice(-2);
    return `${year}-${month}-${day}`; // yyyy-MM-dd
  }

  getCities() {
    this.api.GetCities().subscribe({
      next: (response: any) => {
        console.log('Cities data:', response);
        this.cities = response;this.originCitiesReady=true;this.applyLoadingOrigin();
      },
      error: (error: any) => {
        console.error('Error fetching cities:', error);
        this.toast.error('Failed to fetch cities data.', 'Error');

      },
    });

  }

 onToCityChange(event: any) {
  const selectedOptions = Array.from(event.target.selectedOptions).map((option: any) => option.value);

  const toCityArray = this.form.get('toCity') as FormArray;
  toCityArray.clear(); // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Clear old values before updating

  selectedOptions.forEach(city => toCityArray.push(new FormControl(city)));

  console.log('Selected To Cities:', toCityArray.value);
}


onLoad() {
  if (this.form.invalid) {
    this.form.markAllAsTouched(); // Trigger all validations
    return;
  }
  const today = this.getTodayDateString();
  const formValues = this.form.value;

  const payload: any = {
    startDate: formValues.startDate || today,
    endDate: formValues.endDate || today
  };

  if (formValues.fromCity) {
    payload.fromCity = formValues.fromCity;
  }

  if (formValues.toCity && formValues.toCity.length > 0) {
    payload.toCity = formValues.toCity;
  }

  if (formValues.pickUpBranch) {
    payload.pickUpBranch = formValues.pickUpBranch;
  }

  console.log('Final Parcel Load Data:', payload);

  this.api.FilterParcelLoading(payload).subscribe({
    next: (response: any) => {
      this.toast.success('Parcel Load successful', 'Success');
      console.log("data:", response);
      this.data = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];

      this.LoadSuccess = true;

      if (this.data.length > 0) {
        this.form1.patchValue({
          fromBranch: this.data[0].pickUpBranch,
          toBranch: this.data[0].dropBranch,
          fromBookingDate: this.form.value.startDate,
          toBookingDate: this.form.value.endDate,
          fromCity: this.form.value.fromCity,
          senderName: this.data[0]?.senderName || ''
        });

        this.setFormArray('toCity', this.data.map((d: any) => d.toCity));
        this.setFormArray('grnNo', this.data.map((d: any) => d.grnNo));
        this.setFormArray('lrNumber', this.data.map((d: any) => d.lrNumber));
      }
    },
    error: (error: any) => {
      console.error('Parcel Load Error:', error);

      const errorMessage = error?.error?.message || error?.message || 'An error occurred during parcel load.';

      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate(['/parcelloading']);
        this.toast.error(errorMessage, "Parcel Load Failed");
      });
    }
  });
}
  setFormArray(controlName: string, values: any[]) {
    const formArray = this.form1.get(controlName) as FormArray;
    formArray.clear(); // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Clear previous values
    values.forEach(value => {
      formArray.push(this.fb.control(value));
    });
  }

  onGrnNoChange(event: any, grnNo: string) {
    const formArray = this.form1.get('grnNo') as FormArray;
    if (event.target.checked) {
      // Add if not already selected
      if (!formArray.value.includes(grnNo)) {
        formArray.push(this.fb.control(grnNo));
      }
    } else {
      // Remove if unchecked
      const index = formArray.value.indexOf(grnNo);
      if (index > -1) {
        formArray.removeAt(index);
      }
    }

    // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Update "Select All" status based on selected values
    this.allSelected = this.data.length === formArray.value.length;
    console.log('Selected GRN Numbers:', formArray.value);
  }

  // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Handle "Select All" checkbox
  onSelectAllChange(event: any) {
    const formArray = this.form1.get('grnNo') as FormArray;
    if (event.target.checked) {
      // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Select all if checked
      this.data.forEach((row:any) => {
        if (!formArray.value.includes(row.grnNo)) {
          formArray.push(this.fb.control(row.grnNo));
        }
      });
    } else {
      // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Deselect all if unchecked
      formArray.clear();
    }
    // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Update "Select All" status
    this.allSelected = event.target.checked;
    console.log('All GRN Numbers Selected:', formArray.value);
  }



  ngAfterViewInit(): void {
    // Initialize SlimSelect
    new SlimSelect({
      select: this.demoSelect.nativeElement
    });

    setTimeout(() => {
      this.initOriginSelectors();
      // Initialize select2 for Vehicle Number
      $(this.SelectVechicle.nativeElement).select2();
      $(this.SelectVechicle.nativeElement).on('select2:select', (event: any) => {
        const selectedVehicle = event.params.data.id;
        this.form1.patchValue({ vehicalNumber: selectedVehicle });
        this.form1.get('vehicalNumber')?.markAsTouched();  // ensure validation triggers
      });

    }, 0);
  }


  openScanner() {
    this.showScanner = true;
  }

  closeScanner() {
    this.showScanner = false;
  }

  handleQrCodeResult(result: string) {
    this.closeScanner();

    // Don't set this.data = result directly here (it's just a string)
    this.getQRdata(result);
  }



  // getQRdata(id: any) {
  //   this.api.GetQrGRNnumber(id).subscribe((res: any) => {
  //     console.log(res, 'qrdata');
  //     let newData: any[] = [];
  //     // Handle both object and array data responses
  //     if (Array.isArray(res)) {
  //       newData = res;
  //     } else if (res && typeof res === 'object') {
  //       // If it has grnNo or any parcel identifiers, push it even if success is false
  //       if (res.grnNo || res.lrNumber) {
  //         newData = [res];
  //       }
  //     }

  //     // Merge data to the table
  //     if (newData.length > 0) {
  //       this.data = [...new Map([...(Array.isArray(this.data) ? this.data : []), ...newData].filter((row:any)=>Number(row.bookingStatus) === 0).map((row:any)=>[String(row.grnNo), row])).values()];
  //       this.form1.patchValue({
  //         senderName: this.data[0]?.senderName || ''
  //       });
  //       this.setFormArray('grnNo', this.data.map((d: any) => d.grnNo));
  //       this.setFormArray('lrNumber', this.data.map((d: any) => d.lrNumber));
  //     }

  //     // Show toast depending on success/failure
  //     if (res.success) {

  //       this.toast.success(res.message || 'Parcel loaded successfully', 'Success');
  //     } else {
  //       this.toast.success(res.message || 'Parcel loaded successfully', 'Success');
  //     }
  //   }, err => {
  //     this.toast.error('Parcel already loaded', 'Error');
  //   });
  // }
  getQRdata(id: any) {
    this.api.GetQrGRNnumber(id).subscribe((res: any) => {
      console.log(res, 'qrdata');
      let newData: any[] = [];

      if (Array.isArray(res)) {
        newData = res;
      } else if (res && typeof res === 'object') {
        if (res.grnNo || res.lrNumber) {
          newData = [res];
        }
      }

      if (newData.length > 0) {
        this.data = [...new Map([...(Array.isArray(this.data) ? this.data : []), ...newData].filter((row:any)=>Number(row.bookingStatus) === 0).map((row:any)=>[String(row.grnNo), row])).values()];

        const qr = this.data[0];

        // Patch all required fields from QR
        this.form1.patchValue({
          senderName: qr?.senderName || '',
          fromCity: qr?.fromCity || '',
          toCity: [qr?.toCity || ''], // use array if it's multiselect
          fromBranch: qr?.pickUpBranch || '',
          toBranch: qr?.dropBranch || '',
          fromBookingDate: qr?.ltDate?.split('T')[0] || '', // format ISO to date (yyyy-mm-dd)
          toBookingDate: qr?.bookingDate?.split('T')[0] || ''
        });

        this.setFormArray('grnNo', this.data.map((d: any) => d.grnNo));
        this.setFormArray('lrNumber', this.data.map((d: any) => d.lrNumber));
      }

      if (res.success) {
        this.toast.success(res.message || 'Parcel loaded successfully', 'Success');
      } else {
        this.toast.success(res.message || 'Parcel loaded successfully', 'Success');
      }
    }, err => {
      this.toast.error('Parcel already loaded', 'Error');
    });
  }


  // jkasdbksabd
  private loadingProfile:any;private originCitiesReady=false;private originBranchesReady=false;private originProfileReady=false;private originApplied=false;
private get assignedLoadingBranch(){const ref=this.loadingProfile?.branchId;return (this.branchdata||[]).find((branch:any)=>String(branch._id)===String(ref?._id||ref)||branch.branchUniqueId===(ref?.branchUniqueId||ref));}
get originCityChoices(){if(this.token.isAdmin())return this.cities||[];const city=String(this.assignedLoadingBranch?.city||'').trim().toLowerCase();return (this.cities||[]).filter((row:any)=>String(row.cityName).trim().toLowerCase()===city);}
private syncLoadingSelectors(){setTimeout(()=>{for(const [ref,key] of [[this.selectElem,'fromCity'],[this.branchselect,'pickUpBranch']] as const)if(ref?.nativeElement)$(ref.nativeElement).val(this.form.get(key)?.value||'').trigger('change.select2');},0);}
private initOriginSelectors(){for(const [ref,key] of [[this.selectElem,'fromCity'],[this.branchselect,'pickUpBranch']] as const){if(!ref?.nativeElement)continue;const element=$(ref.nativeElement);if(!element.hasClass('select2-hidden-accessible'))element.select2();element.off('select2:select.loadingOrigin').on('select2:select.loadingOrigin',(event:any)=>this.zone.run(()=>this.form.get(key)?.setValue(event.params.data.id)));}this.syncLoadingSelectors();}
private applyLoadingOrigin(){
  if(this.originApplied||!this.originCitiesReady||!this.originBranchesReady||!this.originProfileReady)return;
  this.originApplied=true;if(this.form.get('fromCity')?.value)return;
  const assigned=this.assignedLoadingBranch;const candidates=this.token.isAdmin()?[...(this.branchdata||[])].sort((a,b)=>Number(b.branchType==='main')-Number(a.branchType==='main')||String(a._id).localeCompare(String(b._id))):[];
  const branch=assigned||candidates[0];const city=this.originCityChoices.find((row:any)=>String(row.cityName).trim().toLowerCase()===String(branch?.city||'').trim().toLowerCase());
  if(!city)return;this.form.patchValue({fromCity:city.cityName});if(branch&&(this.tbcdata||[]).some((row:any)=>row.branchUniqueId===branch.branchUniqueId))this.form.patchValue({pickUpBranch:branch.branchUniqueId});this.syncLoadingSelectors();
}
private clearOriginParcels(){this.data=null;this.LoadSuccess=false;this.form1.patchValue({fromCity:'',fromBranch:'',toBranch:''});for(const key of ['grnNo','lrNumber','toCity'])(this.form1.get(key) as FormArray)?.clear();}
onFromcitySelect(event:any){
  let city=String(event?.target?.value||'');const assigned=this.assignedLoadingBranch;
  if(!this.token.isAdmin()&&assigned&&city.trim().toLowerCase()!==String(assigned.city).trim().toLowerCase())city=this.originCityChoices[0]?.cityName||'';
  if(this.form.get('fromCity')?.value!==city){this.form.patchValue({fromCity:city});return;}
  this.clearOriginParcels();this.tbcdata=(this.branchdata||[]).filter((branch:any)=>String(branch.city).trim().toLowerCase()===city.trim().toLowerCase()&&(this.token.isAdmin()||String(branch._id)===String(assigned?._id)));
  if(!(this.tbcdata||[]).some((branch:any)=>branch.branchUniqueId===this.form.get('pickUpBranch')?.value))this.form.patchValue({pickUpBranch:''});this.syncLoadingSelectors();
}
isSavingParcel = false;
ParcelLoad() {
    if (this.isSavingParcel) return;
    const selectedIds = new Set((this.form1.get('grnNo')?.value || []).map((id:any)=>String(id)));
    const selectedRows = (Array.isArray(this.data) ? this.data : []).filter((row:any)=>selectedIds.has(String(row.grnNo)));
    if (!selectedRows.length) {
      this.toast.warning('Load parcels and select at least one parcel before saving.', 'Select parcels');
      return;
    }
    this.setFormArray('grnNo', selectedRows.map((row:any)=>row.grnNo));
    this.setFormArray('lrNumber', selectedRows.map((row:any)=>row.lrNumber));
    this.setFormArray('toCity', [...new Set(selectedRows.map((row:any)=>row.toCity))]);
    this.form1.patchValue({fromCity:this.form.get('fromCity')?.value,fromBranch:this.form.get('pickUpBranch')?.value});
    if (this.form1.invalid) {
      this.form1.markAllAsTouched(); // show errors
      this.toast.warning('Please fill required fields correctly.', 'Validation');
      return;
    }

    const payload = {
      loadingType: this.form1.value.loadingType,
      fromBranch: this.form1.value.fromBranch,
      toBranch: this.form1.value.toBranch,
      vehicalNumber: this.form1.value.vehicalNumber,
      driverName: this.form1.value.driverName,
      driverNo: this.form1.value.driverNo,
      fromBookingDate: this.form1.value.fromBookingDate,
      toBookingDate: this.form1.value.toBookingDate,
      fromCity: this.form1.value.fromCity,
      senderName: this.form1.value.senderName,
      toCity: this.form1.value.toCity,
      grnNo: this.form1.value.grnNo,
      lrNumber: this.form1.value.lrNumber,
    };

    console.log('Final Payload:', payload);

    this.isSavingParcel = true;
    this.api.ParcelLoading(payload).subscribe({
      next: (response: any) => {
        this.clearOriginParcels();
        this.isSavingParcel = false;
        this.toast.success('Parcel loaded successfully', 'Success');
        setTimeout(() => {
          this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
            this.router.navigate(['/parcelloading']);
          });
        }, 1000);
      },
      error: (error: any) => {
        this.isSavingParcel = false;
        console.error('Parcel loading failed:', error);
        this.toast.error(error?.error?.message || 'Parcel Loading Failed. Please try again', 'Error');
      },
    });
  }


  getVehicleData() {
    this.api.getData('Vehicle').subscribe({
      next: (response: any) => {
        console.log('Vehicle:', response);
        this.vehicle = response;
      },
      error: (error: any) => {
        console.error('Error fetching vehicle data:', error);
      }
    });
  }

  branchData() {
    this.api.getData('branch').subscribe({
      next: (response: any) => {
        console.log('Branch Datakajdkjanfjandfnaf:', response);
        this.branchdata = response;this.originBranchesReady=true;this.onFromcitySelect({target:{value:this.form.get('fromCity')?.value}});this.applyLoadingOrigin(); // Ensure response contains an array of branches
      },
      error: (error: any) => {
        console.error('Error fetching branch data:', error);
      }
    });
  }
    printSection() {
      const printContents = this.printTable.nativeElement.innerHTML;
      const WindowPrt = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
      if (WindowPrt) {
        WindowPrt.document.write(`
          <html>
            <head>
              <title>Print</title>
              <style>
                table {
                  width: 100%;
                  border-collapse: collapse;
                }
                th, td {
                  border: 1px solid #000;
                  padding: 8px;
                  text-align: left;
                  font-family: Arial, sans-serif;
                  font-size: 12px;
                }
                th {
                  background-color: #f2f2f2;
                }
                input[type="checkbox"] {
                  display: none; /* Hide checkboxes in print */
                }
              </style>
            </head>
            <body onload="window.print(); window.close();">
              ${printContents}
            </body>
          </html>
        `);
        WindowPrt.document.close();
      }
    }

    getProfileData(){this.api.GetProfileData().subscribe((res:any)=>{this.loadingProfile=res;this.originProfileReady=true;this.pfdata=res;this.applyLoadingOrigin();});}




      async ExportExel(): Promise<void> {
    const XLSX = await import('xlsx');
        const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(this.printTable.nativeElement);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Bookings');

        const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

        const blob = new Blob([excelBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        FileSaver.saveAs(blob, `ParcelBooking_${new Date().toISOString().slice(0, 10)}.xlsx`);
      }
    }
