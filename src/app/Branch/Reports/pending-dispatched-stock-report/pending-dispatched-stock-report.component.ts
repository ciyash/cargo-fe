import { CommonModule } from '@angular/common';
import { ChangeDetectorRef,Component,ElementRef,ViewChild } from '@angular/core';
import { FormBuilder,FormGroup,FormsModule,ReactiveFormsModule,Validators } from '@angular/forms';
import { ActivatedRoute,Router,RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AdminService } from 'src/app/service/admin.service';
import { BranchService } from 'src/app/service/branch.service';
import { TokenService } from 'src/app/service/token.service';
import { HeaderComponent } from '../../../USER/header/header.component';
declare var $: any;
declare const SlimSelect: any;

import * as FileSaver from 'file-saver';
import type * as XLSX from 'xlsx';
@Component({
  host: {'class':'reports-page'},

  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, HeaderComponent],
  selector: 'app-pending-dispatched-stock-report',
  templateUrl: './pending-dispatched-stock-report.component.html',
  styleUrls: ['./pending-dispatched-stock-report.component.scss']
})
export class PendingDispatchedStockReportComponent {
    @ViewChild('selectElem') selectElem!: ElementRef;
    @ViewChild('pickupbranch') pickupbranch!: ElementRef;
    @ViewChild('selectElem2') selectElem2!: ElementRef;
    @ViewChild('droupbranch') droupbranch!: ElementRef;
    @ViewChild('summaryTable', { static: false }) summaryTable!: ElementRef;
  @ViewChild('bookingsTable', { static: false }) bookingsTable!: ElementRef;


  reportData: any; // your summary + bookings data
  pfdata: any;     // your profile/company info
  totalamount: number = 0;

    cdata: any;
    grnNo: any;
    grnnumber: any;
    onPickupBranchSelect: any;
    onDropBranchSelect: any;
    form!:FormGroup;
    id:any;
    citydata:any;
    branchdata:any;
    bookingSuccess: boolean = false;
    packdata:any;
    fbcdata:any;
    tbcdata:any;
    pdata:any;
    dptype:any;
  dispacthedReport: any;
  dispatchedReport: any;


  today=new Date()

    constructor(private fb: FormBuilder, private api: BranchService, private token:TokenService,
       private cdr: ChangeDetectorRef,  private route: ActivatedRoute,private toastr:ToastrService,
       private router:Router, private admin:AdminService) {
      this.form = this.fb.group({
        fromDate: [this.getTodayDateString(), Validators.required],
        toDate: [this.getTodayDateString(), Validators.required],
        fromCity:  ['all',],
        toCity: ['all', ],
        pickUpBranch: ['all',],
          });
     }

    ngOnInit() {
      // const id = this.activate.snapshot.paramMap.get('id');
      this.api.GetCities().subscribe((res:any)=>{

        this.citydata=res;
      });
      //get branches
      this.api.GetBranch().subscribe((res:any)=>{
        this.branchdata=res;

      });
      this.getProfileData()


    }
    getTodayDateString(): string {
      const today = new Date();
      const day = ('0' + today.getDate()).slice(-2);
      const month = ('0' + (today.getMonth() + 1)).slice(-2);
      const year = today.getFullYear();
      return `${year}-${month}-${day}`; // âœ” HTML date input format
    }








    ngAfterViewInit(): void {
      setTimeout(() => {
        // Initialize Select2 for From City
        $(this.selectElem.nativeElement).select2();
        $(this.selectElem.nativeElement).on('select2:select', (event: any) => {
          const selectedCity = event.params.data.id;

          this.form.patchValue({ fromCity: selectedCity });

          this.onFromcitySelect({ target: { value: selectedCity } });
        });

        // Initialize Select2 for Pickup Branch
        $(this.pickupbranch.nativeElement).select2();
        $(this.pickupbranch.nativeElement).on('select2:select', (event: any) => {
          const selectedBranch = event.params.data.id;

          this.form.patchValue({ pickUpBranch: selectedBranch });

          this.onPickupBranchSelect({ target: { value: selectedBranch } });
        });

        // Initialize Select2 for To City
        $(this.selectElem2.nativeElement).select2();
        $(this.selectElem2.nativeElement).on('select2:select', (event: any) => {
          const selectedToCity = event.params.data.id;

          this.form.patchValue({ toCity: selectedToCity });

          this.onTocitySelect({ target: { value: selectedToCity } });
        });
      }, 0);
    }

    getProfileData() {
      this.api.GetProfileData().subscribe((res: any) => {

        this.pfdata = res; // âœ… Assign full profile, not just branchId

      });
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

  DispatchedStockReport() {
    const payload = this.form.value;


    this.api.PendingDispatchedStockReport(payload).subscribe({
      next: (res: any) => {
        this.reportData = res;
        this.calculateTotalAmount();

      },
      error: (err: any) => {
        console.error("API Error:", err);
          const errorMessage = err?.error?.message || 'Failed to fetch report data';
        this.toastr.error(errorMessage, "Error");
      }
    });
  }



     printReport() {
      const printContents = document.getElementById('print-section')?.innerHTML;
      if (printContents) {
        const popupWin = window.open('', '_blank', 'top=0,left=0,height=100%,width=auto');
        popupWin!.document.open();
        popupWin!.document.write(`
          <html>
            <head>
              <title>Print Report</title>
              <style>
                /* You can include more styles here as needed */
                body {
                  font-family: Arial, sans-serif;
                  margin: 20px;
                }

                table {
                  width: 100%;
                  border-collapse: collapse;
                  font-size: 12px;
                }

                th, td {
                  border: 1px solid #000;
                  padding: 4px;
                  text-align: center;
                }

                h4, h6, p {
                  margin: 4px 0;
                }

                .text-center {
                  text-align: center;
                }

                .fw-bold {
                  font-weight: bold;
                }

                .text-decoration-underline {
                  text-decoration: underline;
                }

                .d-flex {
                  display: flex;
                  justify-content: space-between;
                }

                @media print {
                  .no-print {
                    display: none;
                  }
                }
              </style>
            </head>
            <body onload="window.print(); window.close();">
              ${printContents}
            </body>
          </html>
        `);
        popupWin!.document.close();
      }
    }


calculateTotalAmount() {
  this.totalamount = this.reportData.bookings?.reduce((sum: number, item: { amount: any; }) => sum + (Number(item.amount) || 0), 0) || 0;
}







  async downloadExcel(): Promise<void> {
    const XLSX = await import('xlsx');
    const wb: XLSX.WorkBook = XLSX.utils.book_new();

    // 1ï¸âƒ£ Add Company Header Sheet
    const headerData = [
      ['Pending Dispatch Stock Report'],
      [this.pfdata?.companyName ?? ''],
      [`Address: ${this.pfdata?.location ?? ''} - ${this.pfdata?.branchId?.name ?? ''} | Phone No: ${this.pfdata?.phone ?? ''}`],
      [], // spacer row
    ];
    const headerSheet = XLSX.utils.aoa_to_sheet(headerData);
    XLSX.utils.book_append_sheet(wb, headerSheet, 'Report Info');

    // 2ï¸âƒ£ Add Summary Table
    if (this.summaryTable) {
      const summarySheet = XLSX.utils.table_to_sheet(this.summaryTable.nativeElement);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
    }

    // 3ï¸âƒ£ Add Bookings Table
    if (this.bookingsTable) {
      const bookingsSheet = XLSX.utils.table_to_sheet(this.bookingsTable.nativeElement);
      XLSX.utils.book_append_sheet(wb, bookingsSheet, 'Bookings');
    }

    // 4ï¸âƒ£ Save Excel File
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    FileSaver.saveAs(blob, `Pending_Dispatch_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
}
