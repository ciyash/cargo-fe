import { DomesticPhoneDirective } from '../../../shared/domestic-phone.directive';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../../USER/header/header.component';
import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BranchService } from 'src/app/service/branch.service';
@Component({
  standalone: true,
  imports: [DomesticPhoneDirective, CommonModule, FormsModule, ReactiveFormsModule, RouterModule, HeaderComponent],
  selector: 'app-search-grn-number',
  templateUrl: './search-grn-number.component.html',
  styleUrls: ['./search-grn-number.component.scss'],
})
export class SearchGrnNumberComponent {
  @Input() embedded = false;

  activeTab='booking'; editing=false; editDraft:any={};
  editFields=[{key:'senderName',label:'Sender name'},{key:'senderMobile',label:'Sender phone'},{key:'senderAddress',label:'Sender address'},{key:'senderGst',label:'Sender GST'},{key:'receiverName',label:'Receiver name'},{key:'receiverMobile',label:'Receiver phone'},{key:'receiverAddress',label:'Receiver address'},{key:'receiverGst',label:'Receiver GST'},{key:'remarks',label:'Booking remarks'}];
  get canEdit(){const row=this.data2?.[0];return row?.bookingStatus===0&&!row?.loadingDate&&(!row?.confirmationStatus||row.confirmationStatus==='confirmed')&&row?.fulfilment!=='external';}
  startEdit(){if(!this.canEdit)return;this.activeTab='booking';this.editDraft={...this.data2[0]};this.editing=true;}
  saveEdit(){
    if(this.saving||!this.canEdit)return;
    if(!String(this.editDraft.senderName||'').trim()||!String(this.editDraft.receiverName||'').trim()){this.toast.warning('Sender and receiver names are required');return;}
    if(!/^\d{10}$/.test(String(this.editDraft.senderMobile||''))||!/^\d{10}$/.test(String(this.editDraft.receiverMobile||''))){this.toast.warning('Enter 10-digit sender and receiver phone numbers');return;}
    const payload=Object.fromEntries(this.editFields.map(field=>[field.key,this.editDraft[field.key]??'']));this.saving=true;
    this.api.editBookedParcel(this.data2[0].grnNo,payload).subscribe({next:(res:any)=>{this.saving=false;this.editing=false;this.data2=[{...this.data2[0],...res.booking}];this.toast.success('Booking details updated');},error:(error:any)=>{this.saving=false;this.toast.error(error?.error?.message||'Unable to update booking');}});
  }
  searchResult: any[] = [];
  data2: any;
  idselectmsg: string = '';
  regname: any[] = [];
  errorMessage: string = '';
  updata: any;
  form: FormGroup;
  searchField: string = 'grnNo'; // Default selection
  searchTerm: string = '';

  branchId: any;
  saving = false;
  constructor(
    private api: BranchService,
    private activeroute: ActivatedRoute,
    private fb: FormBuilder,
    private router: Router,
    private toast:ToastrService
  ) {
    this.form = this.fb.group({
      grnNo: ['', Validators.required],
      receiverName: ['', Validators.required],
      receiverMobile: ['', [Validators.required, Validators.pattern(/^\+?\d{7,15}$/)]],
      toPayDeliveredAmount: [0, [Validators.required, Validators.min(0)]],
      lrNumber: [''],

    });
  }
  ngOnInit(): void {
    this.searchTerm = String(this.activeroute.snapshot.params['grnNo'] ?? '');
  }

  updateParcelStatus() {
    this.form.markAllAsTouched();
    if(this.saving || this.form.invalid)return;
    const due=this.data2?.[0]?.bookingType==='toPay'?Number(this.data2[0].grandTotal):0;
    if(Math.abs(Number(this.form.value.toPayDeliveredAmount)-due)>0.001){this.toast.warning('Confirm the full To Pay amount; other freight types collect zero');return;}
    this.saving=true;
    const payload = {
      grnNo: this.form.value.grnNo,
      receiverName: this.form.value.receiverName,
      receiverMobile: this.form.value.receiverMobile,
      toPayDeliveredAmount:Number(this.form.value.toPayDeliveredAmount),
    };
    console.log('Final Payload:', payload);

    this.api.ReceivedParcelUpdate(payload).subscribe(
      (res: any) => {
        this.saving=false;
        console.log('Update Status:', res);
        this.updata = res;

        // âœ… Show success message from backend if available
        if (res.message) {
          this.toast.success(res.message, 'Success');
        } else {
          this.toast.success('Parcel status updated successfully', 'Success');
        }

        // âœ… Redirect after short delayad
        setTimeout(() => {
          this.router
            .navigateByUrl('/', { skipLocationChange: true })
            .then(() => {
              this.router.navigate(['/booking']);
            });
        }, 500);
      },
      (error) => {
        this.saving=false;
        console.error('Error updating status:', error);

        // âœ… Show error message from backend if available
        if (error.error && error.error.message) {
          this.toast.error(error.error.message, 'Error');
        } else {
          this.toast.error('Failed to update parcel status', 'Error');
        }
      }
    );
  }

  searchUser(): void {

    if (this.searchTerm && this.searchTerm.trim() !== '' && this.searchField) {
      console.log(
        'Searching by:',
        this.searchField,
        'Value:',
        this.searchTerm.trim()
      );
      const searchPayload = {
        mobile: '',
        searchCustomer: '',
        grnNo: '',
        lrNumber: '',
      };
      console.log('searchdata:', searchPayload);
      switch (this.searchField) {
        case 'senderMobile':
          searchPayload.mobile = this.searchTerm.trim();
          break;
        case 'senderName':
          searchPayload.searchCustomer = this.searchTerm.trim();
          break;
        case 'grnNo':
          searchPayload.grnNo = this.searchTerm.trim();
          break;
        case 'lrNumber':
          searchPayload.lrNumber = this.searchTerm.trim();
          break;
      }
      this.api.GetSearch(searchPayload).subscribe((res: any) => {
        this.data2 = res;this.activeTab="booking";this.editing=false;
        const row=this.data2?.[0];
        if(row)this.form.patchValue({grnNo:row.grnNo,receiverName:row.receiverName,receiverMobile:row.receiverMobile,toPayDeliveredAmount:row.bookingType==='toPay'?row.grandTotal:0});
        console.log('searchdataobject:', this.data2);

      });
    }
  }
}
