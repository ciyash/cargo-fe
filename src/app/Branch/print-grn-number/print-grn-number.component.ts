import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { QRCodeModule } from 'angularx-qrcode';
import { BranchService } from 'src/app/service/branch.service';
@Component({standalone:true,imports:[CommonModule,RouterModule,QRCodeModule],selector:'app-print-grn-number',templateUrl:'./print-grn-number.component.html',styleUrls:['./print-grn-number.component.scss']})
export class PrintGrnNumberComponent implements OnInit,OnChanges,OnDestroy {
  @Input() grnNo:string|number='';
  qrData='';data1:any;pfdata:any;loading=false;error='';
  private bookingRequest?:Subscription;private profileRequest?:Subscription;
  constructor(private api:BranchService,private activeroute:ActivatedRoute){}
  get embedded(){return this.grnNo!==''&&this.grnNo!==null&&this.grnNo!==undefined;}
  get companyName(){return this.pfdata?.companyId?.name||this.data1?.companyId?.name||'Booking receipt';}
  get initials(){return this.pfdata?.companyId?.logoText||(this.companyName.match(/\b\w/g)||['C','N']).slice(0,2).join('').toUpperCase();}
  get paymentLabel(){return ({paid:'Paid',toPay:'To pay',credit:'Credit',FOC:'Free of cost',clr:'CLR'} as Record<string,string>)[this.data1?.bookingType]||this.data1?.bookingType||'—';}
  ngOnInit(){this.loadReceipt();this.profileRequest=this.api.GetProfileData().subscribe({next:profile=>this.pfdata=profile,error:()=>{}});}
  ngOnChanges(changes:SimpleChanges){if(changes['grnNo']&&!changes['grnNo'].firstChange)this.loadReceipt();}
  ngOnDestroy(){this.bookingRequest?.unsubscribe();this.profileRequest?.unsubscribe();}
  loadReceipt(){
    const id=String(this.grnNo||this.activeroute.snapshot.params['grnNo']||'').trim();
    this.bookingRequest?.unsubscribe();this.data1=null;this.error='';this.qrData='';
    if(!/^\d+$/.test(id)){this.error='A valid booking reference is required.';this.loading=false;return;}
    this.loading=true;this.bookingRequest=this.api.GetGRNnumber(id).subscribe({next:(result:any)=>{this.loading=false;this.data1=result?.booking;if(!this.data1){this.error='Booking receipt could not be found.';return;}this.qrData=String(this.data1.grnNo??id);},error:()=>{this.loading=false;this.error='Could not load this receipt. Please retry.';}});
  }
  printPage(){if(this.data1&&!this.loading)window.print();}
}