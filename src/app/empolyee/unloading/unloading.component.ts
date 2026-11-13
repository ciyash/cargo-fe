import { NgZone } from '@angular/core';
import { TokenService } from 'src/app/service/token.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../USER/header/header.component';
import { RippleModule } from 'primeng/ripple';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { ChangeDetectorRef, Component } from '@angular/core';
import {  FormArray,  FormBuilder,  FormControl,  FormGroup,  Validators,} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { BranchService } from 'src/app/service/branch.service';
import { ToastrService } from 'ngx-toastr';
import type * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

declare var $: any;
declare const SlimSelect: any;
import { ElementRef, ViewChild, AfterViewInit } from '@angular/core';
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, HeaderComponent, RippleModule, ZXingScannerModule],
  selector: 'app-unloading',
  templateUrl: './unloading.component.html',
  styleUrls: ['./unloading.component.scss']
})
export class UnloadingComponent {
    adminData: any;
    form!: FormGroup;
    form1: FormGroup;
    cities: any;
    vehicle: any = {};
    branchdata: any;
    data: any;
    searchTerm: string = ''; // For binding with input field
    idselectmsg: string = '';
    errorMessage: string = '';
    data2: any;
    data1: any;
    LoadSuccess: boolean = false;
    allSelected: boolean = false;
    tbcdata: any;
    @ViewChild('selectElem') selectElem!: ElementRef;
    @ViewChild('branch') branch!: ElementRef;
    @ViewChild('selectvehicle') selectvehicle!: ElementRef;
    // @ViewChild('droupbranch') droupbranch!: ElementRef;
    @ViewChild('demoSelect') demoSelect!: ElementRef;
    selectedbranch: any;
    onVehicleSelect: any;
    apiResponse: any;
    bookings: any;
    bkdata: any[] = [];
    summary: any = {};
    qrdata: string = '';
    showScanner: boolean = false;
    today = new Date();

    constructor(
      private api: BranchService, private token:TokenService, private zone:NgZone,
      private fb: FormBuilder,
      private messageService: MessageService,
      private router: Router,
      private activeroute: ActivatedRoute,
      private toastr: ToastrService, private cdRef: ChangeDetectorRef
    ) {
      this.form = this.fb.group({
        fromDate: [this.getTodayDateString(), Validators.required],
        toDate: [this.getTodayDateString(), Validators.required],
        fromCity: [''],
        toCity: [''],
        vehicalNumber: ['',],
        branch: [''] // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦

      });
      this.form1 = this.fb.group({
        fromBookingDate: ['', ],
        toBookingDate: ['', ],
        fromCity: this.fb.array([]),
        toCity: ['', ], // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Ensure toCity is a FormControl, NOT a FormArray
        branch: ['', ],
        vehicalNumber: ['', ],
        grnNo: this.fb.array([],),
        bookingType: [''],
      });
    }
    ngOnInit() {
 this.form.get('toCity')?.valueChanges.subscribe(city=>this.onFromcitySelect({target:{value:city}}));
 this.form.get('branch')?.valueChanges.subscribe(()=>this.clearOriginParcels());
 this.api.getData('branch').subscribe((rows:any)=>{this.branchdata=rows;this.originBranchesReady=true;this.applyLoadingOrigin();});
 this.api.GetProfileData().subscribe((profile:any)=>{this.loadingProfile=profile;this.originProfileReady=true;this.applyLoadingOrigin();});
      this.searchTerm = this.activeroute.snapshot.params['grnNumber'];
      this.getCities();
      this.getvehicleData();
      // this.updateFormattedDate();

    }

    getTodayDateString(): string {
      const today = new Date();
      const day = ('0' + today.getDate()).slice(-2);
      const month = ('0' + (today.getMonth() + 1)).slice(-2);
      const year = today.getFullYear();
      return `${year}-${month}-${day}`; // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â HTML date input format
    }



    ngAfterViewInit(): void { this.initOriginSelectors();
      new SlimSelect({
        select: this.demoSelect.nativeElement
      });

      setTimeout(() => {

        // $(this.demoSelect.nativeElement).select2();
        $(this.demoSelect.nativeElement).on('select2:select', (event: any) => {
          const selectedCity = event.params.data.id;
          this.form.get('fromCity')?.setValue(selectedCity);
          
          console.log('Updated To City:', this.form.get('fromCity')?.value);
        });

        $(this.selectElem.nativeElement).select2();
        $(this.selectElem.nativeElement).on('select2:select', (event: any) => {
          const selectedCity = event.params.data.id;
          this.zone.run(()=>this.form.get('toCity')?.setValue(selectedCity));
          this.onTocitySelect({ target: { value: selectedCity } });
          console.log('Updated To City:', this.form.get('toCity')?.value);
        });


        $(this.branch.nativeElement).select2();
        $(this.branch.nativeElement).on('select2:select', (event: any) => {
          const selectedBranch = event.params.data.id;
          this.zone.run(()=>this.form.get('branch')?.setValue(selectedBranch));
          console.log('Updated Branch:', this.form.get('branch')?.value);
        });


        $(this.selectvehicle.nativeElement).select2();
        $(this.selectvehicle.nativeElement).on('select2:select', (event: any) => {
          const selectedVehicle = event.params.data.id;
          this.form.get('vehicalNumber')?.setValue(selectedVehicle);
          console.log(
            'Updated Vehicle Number:',
            this.form.get('vehicalNumber')?.value
          );
        });
      }, 0);
    }


  onLoad() {
 if(this.form.invalid){this.form.markAllAsTouched();return;}
 const value=this.form.getRawValue();
 this.clearOriginParcels();
 this.api.FilterParcelUnLoading({fromDate:value.fromDate,toDate:value.toDate,fromCity:value.fromCity||[],toCity:value.toCity||'',branch:value.branch||'',vehicalNumber:value.vehicalNumber||''}).subscribe({
 next:(response:any)=>{
  const rows=Array.isArray(response)?response:Array.isArray(response?.data)?response.data:[];
  this.bkdata=rows.flatMap((row:any)=>Array.isArray(row?.bookings)?row.bookings:[row]);
  this.apiResponse=rows;this.LoadSuccess=this.bkdata.length>0;this.summary={};
  for(const row of this.bkdata){const type=row.bookingType;this.summary[type] ||= {totalQuantity:0,totalGrandTotal:0};this.summary[type].totalQuantity+=Number(row.totalQuantity)||0;this.summary[type].totalGrandTotal+=Number(row.grandTotal)||0;}
  this.form1.patchValue({branch:value.branch,vehicalNumber:value.vehicalNumber});
  if(!this.bkdata.length)this.toastr.info('No loaded parcels found for these filters.','No parcels');
 },error:(error:any)=>this.toastr.error(error?.error?.message||'Unable to fetch loaded parcels.','Unloading filter')});
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


  getQRdata(id: string) {
    this.api.GetQrUnloadGRNnumber(id).subscribe(
      (res: any) => {
        console.log('Scanned QR data:', res);

        let newData: any[] = [];

        // Normalize based on your API structure
        if (res?.data?.length) {
          this.apiResponse = res.data || [];

          // Combine all bookings into one array
          this.bkdata = this.apiResponse.flatMap((item: any) => item.bookings);
        } else if (Array.isArray(res)) {
          newData = res;
        } else if (typeof res === 'object') {
          newData = [res];
        }

        this.bkdata = [...this.bkdata, ...newData]; // avoid push()

        this.toastr.success('Parcel Unloaded successfully', 'Success');
        this.cdRef.detectChanges(); // Ensure UI refresh if needed
      },
      (err) => {
        this.toastr.error('Parcel already Unloaded or Error occurred', 'Error');
      }
    );
  }




    onTocitySelect(event:any){this.onFromcitySelect(event);}
private loadingProfile:any;private originCitiesReady=false;private originBranchesReady=false;private originProfileReady=false;private originApplied=false;
private get assignedLoadingBranch(){const ref=this.loadingProfile?.branchId;return (this.branchdata||[]).find((branch:any)=>String(branch._id)===String(ref?._id||ref)||branch.branchUniqueId===(ref?.branchUniqueId||ref));}
get originCityChoices(){if(this.token.isAdmin())return this.cities||[];const city=String(this.assignedLoadingBranch?.city||'').trim().toLowerCase();return (this.cities||[]).filter((row:any)=>String(row.cityName).trim().toLowerCase()===city);}
private syncLoadingSelectors(){setTimeout(()=>{for(const [ref,key] of [[this.selectElem,'toCity'],[this.branch,'branch']] as const)if(ref?.nativeElement)$(ref.nativeElement).val(this.form.get(key)?.value||'').trigger('change.select2');},0);}
private initOriginSelectors(){for(const [ref,key] of [[this.selectElem,'toCity'],[this.branch,'branch']] as const){if(!ref?.nativeElement)continue;const element=$(ref.nativeElement);if(!element.hasClass('select2-hidden-accessible'))element.select2();element.off('select2:select.loadingOrigin').on('select2:select.loadingOrigin',(event:any)=>this.zone.run(()=>this.form.get(key)?.setValue(event.params.data.id)));}this.syncLoadingSelectors();}
private applyLoadingOrigin(){
  if(this.originApplied||!this.originCitiesReady||!this.originBranchesReady||!this.originProfileReady)return;
  this.originApplied=true;if(this.form.get('toCity')?.value)return;
  const assigned=this.assignedLoadingBranch;const candidates=this.token.isAdmin()?[...(this.branchdata||[])].sort((a,b)=>Number(b.branchType==='main')-Number(a.branchType==='main')||String(a._id).localeCompare(String(b._id))):[];
  const branch=assigned||candidates[0];const city=this.originCityChoices.find((row:any)=>String(row.cityName).trim().toLowerCase()===String(branch?.city||'').trim().toLowerCase());
  if(!city)return;this.form.patchValue({toCity:city.cityName});if(branch&&(this.tbcdata||[]).some((row:any)=>row.branchUniqueId===branch.branchUniqueId))this.form.patchValue({branch:branch.branchUniqueId});this.syncLoadingSelectors();
}
private clearOriginParcels(){this.data=null;this.LoadSuccess=false;this.bkdata=[];this.apiResponse=[];this.summary={};this.allSelected=false;(this.form1.get('grnNo') as FormArray)?.clear();}
onFromcitySelect(event:any){
  let city=String(event?.target?.value||'');const assigned=this.assignedLoadingBranch;
  if(!this.token.isAdmin()&&assigned&&city.trim().toLowerCase()!==String(assigned.city).trim().toLowerCase())city=this.originCityChoices[0]?.cityName||'';
  if(this.form.get('toCity')?.value!==city){this.form.patchValue({toCity:city});return;}
  this.clearOriginParcels();this.tbcdata=(this.branchdata||[]).filter((branch:any)=>String(branch.city).trim().toLowerCase()===city.trim().toLowerCase()&&(this.token.isAdmin()||String(branch._id)===String(assigned?._id)));
  if(!(this.tbcdata||[]).some((branch:any)=>branch.branchUniqueId===this.form.get('branch')?.value))this.form.patchValue({branch:''});this.syncLoadingSelectors();
}

getCities() {
      this.api.GetCities().subscribe({
        next: (response: any) => {
          console.log('Cities data:', response);
          this.cities = response;this.originCitiesReady=true;this.applyLoadingOrigin();
          console.log(this.cities, 'cites');
        },
        error: (error: any) => {
          console.error('Error fetching cities:', error);
          alert('Failed to fetch cities data.');
        },
      });
    }
    get fromCityArray() {
      return this.form.get('fromCity') as FormArray;
    }

    onFromCityChange(event:any) {
 const values=Array.from(event.target.selectedOptions||[]).map((option:any)=>option.value);
 this.zone.run(()=>this.form.get('fromCity')?.setValue(values));
}


    setFormArray(controlName: string, values: any[]) {
      const formArray = this.form1.get(controlName) as FormArray;
      formArray.clear(); // Clear existing
      values.flat().forEach((value) => {
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

      // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Update "Select All" status based on selected values
      this.allSelected = this.bkdata.length === formArray.value.length;
      console.log('Selected GRN Numbers:', formArray.value);
    }

    onSelectAllChange(event: any) {
      const formArray = this.form1.get('grnNo') as FormArray;
      formArray.clear();

      if (event.target.checked && this.bkdata?.length > 0) {
        this.bkdata.forEach((row: any) => {
          const grn = row?.grnNo;
          if (grn && !formArray.value.includes(grn)) {
            formArray.push(this.fb.control(grn));
          }
        });
      }

      this.allSelected = event.target.checked;
      console.log('All selected GRNs:', formArray.value);
    }

    getvehicleData() {
      this.api.VehicleData().subscribe({
        next: (response: any) => {
          console.log('Vehicle:', response);
          this.vehicle = response;
        },
        error: (error: any) => {
          console.error('Error fetching vehicle data:', error);
        },
      });
    }

   isSavingUnloading=false;
 ParcelLoad() {
  if(this.isSavingUnloading)return;
  const ids=new Set((this.form1.get('grnNo')?.value||[]).map((id:any)=>String(id)));
  const rows=this.bkdata.filter((row:any)=>ids.has(String(row.grnNo)));
  if(!rows.length){this.toastr.warning('Select at least one parcel to unload.','Select parcels');return;}
  const branch=this.form.get('branch')?.value||rows[0].dropBranch;
  const vehicle=this.form.get('vehicalNumber')?.value||rows[0].vehicalNumber;
  if(rows.some((row:any)=>row.dropBranch!==branch||row.vehicalNumber!==vehicle||row.bookingType!==rows[0].bookingType)){
   this.toastr.warning('Select parcels with the same drop branch, vehicle and booking type.','Check selected parcels');return;
  }
  if(!vehicle){this.toastr.warning('Select the vehicle used for these parcels.','Vehicle required');return;}
  const payload:any={fromBookingDate:this.form.get('fromDate')?.value,toBookingDate:this.form.get('toDate')?.value,fromCity:[...new Set(rows.map((row:any)=>row.fromCity))],toCity:rows[0].toCity,branch,vehicalNumber:vehicle,grnNo:rows.map((row:any)=>row.grnNo),lrNumber:rows.map((row:any)=>row.lrNumber),bookingType:rows[0].bookingType};
  this.isSavingUnloading=true;
  this.api.ParcelUnLoading(payload).subscribe({next:()=>{this.isSavingUnloading=false;this.clearOriginParcels();this.toastr.success('Selected parcels unloaded successfully.','Success');},error:(error:any)=>{this.isSavingUnloading=false;this.toastr.error(error?.error?.message||'Unable to save parcel unloading.','Unloading failed');}});
 }








    // selectedDate: string = moment().format('YYYY/MM/DD');
    // formattedDate: string = '';
    //   dateFormat: string = 'DD/MMMM/YYYY';



    //   updateFormattedDate() {
    //     if (this.selectedDate) {
    //       this.formattedDate = moment(this.selectedDate, 'YYYY-MM-DD').format(this.dateFormat);
    //     }
    //   }

    //   onSubmit() {
    //     alert('Selected Date: ' + this.selectedDate + '\nFormatted: ' + this.formattedDate);
    //   }

    printTable() {
      const printContent = document.getElementById('print-section');
      const WindowPrt = window.open('', '', 'width=900,height=650');
      if (WindowPrt && printContent) {
        WindowPrt.document.write(`
          <html>
            <head>
              <title>Print Table</title>
              <style>
                table {
                  width: 100%;
                  border-collapse: collapse;
                }
                th, td {
                  border: 1px solid black;
                  padding: 8px;
                  text-align: left;
                }
              </style>
            </head>
            <body onload="window.print(); window.close();">
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        WindowPrt.document.close();
      }
    }


    async ExportEXcel(): Promise<void> {
    const XLSX = await import('xlsx');
      const headerData = [];

      // Optional: Add title or meta info
      headerData.push(['Parcel Booking GRN Report']);
      headerData.push([
        `Print Date: ${this.formatDate(this.today)} Time: ${this.formatTime(this.today)}`
      ]);
      headerData.push([]); // Blank row

      // Table headers
      const tableHeaders = [
        'S.No',
        'GRN No',
        'Book by Branch',
        'Drop Branch',
        'From City',
        'To City',
        'Booking Date',
        'Sender',
        'Receiver',
        'Qty',
        'Charges'
      ];
      headerData.push(tableHeaders);

      // Table data rows
      const tableRows = this.bkdata.map((row: any, index: number) => [
        index + 1,
        row?.lrNumber,
        row?.pickUpBranchname,
        row?.dropBranchname,
        row?.fromCity,
        row?.toCity,
        this.formatDate(row?.bookingDate),
        row?.senderName,
        row?.receiverName,
        row?.totalQuantity,
        row?.grandTotal
      ]);

      const sheetData = [...headerData, ...tableRows];

      const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(sheetData);
      const workbook: XLSX.WorkBook = {
        Sheets: { 'Report': worksheet },
        SheetNames: ['Report']
      };

      const excelBuffer: any = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
      });

      const blob: Blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
      });

      FileSaver.saveAs(blob, 'Parcel_GRN_Report.xlsx');
    }


    formatDate(date: Date): string {
      const d = new Date(date);
      return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${d.getFullYear()}`;
    }

    formatTime(date: Date): string {
      const d = new Date(date);
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }


    }
