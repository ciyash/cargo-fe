import { CommonModule } from '@angular/common';
import { ChangeDetectorRef,Component,ElementRef,HostListener,NgZone,ViewChild } from '@angular/core';
import { FormArray,FormBuilder,FormGroup,FormsModule,ReactiveFormsModule,Validators } from '@angular/forms';
import { ActivatedRoute,Router,RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AdminService } from 'src/app/service/admin.service';
import { BranchService } from 'src/app/service/branch.service';
import { TokenService } from 'src/app/service/token.service';
import { HeaderComponent } from "../../USER/header/header.component";
import { BillingComponent } from '../../shared/billing/billing.component';
import { DomesticPhoneDirective } from '../../shared/domestic-phone.directive';
import { SearchGrnNumberComponent } from '../Widgets/search-grn-number/search-grn-number.component';
declare var $: any;
declare const SlimSelect: any;

@Component({
  standalone: true,
  imports: [DomesticPhoneDirective, BillingComponent, CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SearchGrnNumberComponent, HeaderComponent],
  selector: 'app-parcelbooking',
  templateUrl: './parcelbooking.component.html',
  styleUrls: ['./parcelbooking.component.scss'],
})
export class ParcelbookingComponent {
  optionName=(_:number,option:any)=>option.name;
  packageLoading=false;dispatchLoading=false;packageError='';dispatchError='';
  @HostListener('window:focus')
  loadBookingOptions(){
    if(this.packageLoading||this.dispatchLoading)return;
    this.packageLoading=true;this.dispatchLoading=true;this.packageError='';this.dispatchError='';
    this.api.GetPAckagesType().subscribe({next:(res:any)=>{this.packdata=Array.isArray(res)?res:Array.isArray(res?.data)?res.data:[];this.packageLoading=false;if(!this.packdata.length)this.packageError='No package types added. Ask your Company Admin to add them.';},error:()=>{this.packageLoading=false;this.packageError='Package types could not load. Select Refresh lists to retry.';}});
    this.admin.GetDispatchtypeData().subscribe({next:(res:any)=>{this.dptype=Array.isArray(res)?res:Array.isArray(res?.data)?res.data:[];this.dispatchLoading=false;if(!this.dptype.length)this.dispatchError='No dispatch types added. Ask your Company Admin to add them.';},error:()=>{this.dispatchLoading=false;this.dispatchError='Dispatch types could not load. Select Refresh lists to retry.';}});
  }
  @ViewChild(BillingComponent) billing?: BillingComponent;
  adminData: any;
  form!:FormGroup;
  showTable: boolean = false;
  id:any;
  citydata:any[]=[];
  branchdata:any[]=[];
  bdata: any[] = [];
  totalPrice:any;
  total1:any;
  pfdata:any;
  bookingSuccess: boolean = false;
  gdata:any;
  packdata:any[]=[];
  fbcdata:any;
  tbcdata:any;
  pdata:any[]=[];
  form1:FormGroup;
  sdata: number = 0;
  searchTerm: string = '';       // For binding with input field
  searchResult: any[] = [];
  idselectmsg: string = '';
  regname: any[] = [];
  errorMessage: string = '';
  userList: any[] = [];
  showDropdown:boolean=true;

  dptype:any[]=[];
  @ViewChild('selectElem') selectElem!: ElementRef;
  @ViewChild('pickupbranch') pickupbranch!: ElementRef;
  @ViewChild('selectElem2') selectElem2!: ElementRef;
  @ViewChild('droupbranch') droupbranch!: ElementRef;
@ViewChild('Company')Company!:ElementRef
  cdata: any;
  grnNo: any;
  grnnumber: any;


  modelData: any;
  showModal: boolean = false;
  companyList:any;

  constructor(private fb: FormBuilder, private api: BranchService, private token:TokenService,
     private cdr: ChangeDetectorRef,  private route: ActivatedRoute,private toastr:ToastrService,
     private router:Router, private admin:AdminService, private zone:NgZone) {
    this.form = this.fb.group({
      fromCity:  ['', Validators.required],
      toCity: ['', Validators.required],
      pickUpBranch: ['', Validators.required],
      dropBranch: ['', Validators.required],
      dispatchType: [''],
      bookingType: ['', Validators.required],
      senderName: ['', Validators.required],
      senderMobile: ['', Validators.required],
      senderAddress: [''],
      senderGST: [''],
      receiverName:['', Validators.required],
      receiverMobile: ['', Validators.required],
      receiverAddress: [''],
      receiverGst: [''],
      serviceCharges: [0],  // ₹10 per item
      parcelGstAmount: [0, Validators.min(0)],
      hamaliCharges: [0],
      doorDeliveryCharges: [0],
      doorPickupCharges: [0],
      valueOfGoods: [''],
      grandTotal: [''],
      agent:[''],
      packages: this.fb.array([]),

        });

        this.form1 = this.fb.group({
          fromCity: [''],
          toCity: ['', Validators.required],
            });

   }

  ngOnInit() {
    this.form.get('fromCity')?.valueChanges.subscribe(city=>this.onFromcitySelect({target:{value:city}}));
    this.getAllCompany();
    // const id = this.activate.snapshot.paramMap.get('id');
    this.api.GetCities().subscribe((res:any)=>{

      this.citydata=res;this.pickupCitiesLoaded=true;this.applyLoginPickup();
    });
    //get branches
    this.api.GetBranch().subscribe((res:any)=>{

      this.branchdata=res;this.pickupBranchesLoaded=true;this.onFromcitySelect({target:{value:this.form.value.fromCity}});this.applyLoginPickup();

    });
    //get Packages
    this.loadBookingOptions();



    this.getProfileData();
    this.addOrderItem()

    this.form.get('bookingType')?.valueChanges.subscribe((value) => {

      if (value !== 'credit') {
        this.form.patchValue({
          agent: ''
        });

      }
      this.calculateGrandTotal();
    });
  }



  ngAfterViewInit(): void {
    setTimeout(() => {
      $(this.selectElem.nativeElement).select2();
      $(this.selectElem.nativeElement).on('select2:select', (event: any) => this.zone.run(() => {
        const selectedCity = event.params.data.id;

        this.form.patchValue({ fromCity: selectedCity });


      }));

      // Initialize Select2 for Pickup Branch
      $(this.pickupbranch.nativeElement).select2();
      $(this.pickupbranch.nativeElement).on('select2:select', (event: any) => this.zone.run(() => {
        const selectedBranch = event.params.data.id;

        this.form.patchValue({ pickUpBranch: selectedBranch });

        this.onPickupBranchSelect({ target: { value: selectedBranch } });
      }));

      // Initialize Select2 for To City
      $(this.selectElem2.nativeElement).select2();
      $(this.selectElem2.nativeElement).on('select2:select', (event: any) => this.zone.run(() => {
        const selectedToCity = event.params.data.id;

        this.form.patchValue({ toCity: selectedToCity });

        this.onTocitySelect({ target: { value: selectedToCity } });
      }));

      // Initialize Select2 for Drop Branch
      $(this.droupbranch.nativeElement).select2();
      $(this.droupbranch.nativeElement).on('select2:select', (event: any) => this.zone.run(() => {
        const selectedDropBranch = event.params.data.id;

        this.form.patchValue({ dropBranch: selectedDropBranch });

        this.onDropBranchSelect({ target: { value: selectedDropBranch } });
      }));

    }, 0);
  }
getProfileData(){
  this.api.GetProfileData().subscribe((res:any)=>{

    this.pfdata=res.branchId;this.loginPickupProfile=res;this.pickupProfileLoaded=true;this.applyLoginPickup();

  });
}

fetchServiceCharges() {
  const fromCity = this.form.get('fromCity')?.value;
  const toCity = this.form.get('toCity')?.value;

  if (fromCity && toCity) {
    this.api.FilterBookingServiceCharges({ fromCity, toCity }).subscribe(
      (res: any) => {


        if (res && res.length > 0) {
          const chargeData = res[0]; // First item in the array
          this.sdata = chargeData.serviceCharge || 0;

          // Update form with service charges and recalculate total
          this.form.patchValue({ serviceCharges: this.sdata });
          this.calculateGrandTotal();
        } else {
          console.warn('No service charge found for the given cities.');
          this.form.patchValue({ serviceCharges: 0 });
          this.calculateGrandTotal();
        }
      },
      (error: any) => {
        console.error('Error fetching service charges:', error);
      }
    );
  } else {
    console.warn('Both fromCity and toCity must be selected.');
  }
}

private pickupCitiesLoaded=false;private pickupBranchesLoaded=false;private pickupProfileLoaded=false;private pickupDefaultApplied=false;
private loginPickupProfile:any;
private syncPickupSelectors(){
  setTimeout(()=>{
    if(this.selectElem?.nativeElement)$(this.selectElem.nativeElement).val(this.form.value.fromCity||'').trigger('change.select2');
    if(this.pickupbranch?.nativeElement)$(this.pickupbranch.nativeElement).val(this.form.value.pickUpBranch||'').trigger('change.select2');
  },0);
}
private applyLoginPickup(){
  if(this.pickupDefaultApplied||!this.pickupCitiesLoaded||!this.pickupBranchesLoaded||!this.pickupProfileLoaded)return;
  this.pickupDefaultApplied=true;
  // A city selected while requests were loading takes precedence over the default.
  if(this.form.value.fromCity)return;
  const profile=this.loginPickupProfile,reference=profile?.branchId;
  let assigned=this.branchdata.find(branch=>String(branch._id)===String(reference?._id||reference)||branch.branchUniqueId===(reference?.branchUniqueId||reference));
  const profileCity=String(profile?.branchCity||profile?.city||'').trim().toLowerCase();
  if(!assigned){
    const candidates=this.branchdata.filter(branch=>!profileCity||String(branch.city).trim().toLowerCase()===profileCity);
    assigned=[...candidates].sort((a,b)=>Number(b.branchType==='main')-Number(a.branchType==='main')||String(a._id).localeCompare(String(b._id)))[0];
  }
  const name=String(assigned?.city||profileCity).trim().toLowerCase();
  const city=this.citydata.find(row=>String(row.cityName).trim().toLowerCase()===name);
  if(!city)return;
  this.form.patchValue({fromCity:city.cityName});
  if(assigned&&this.pdata.some(branch=>branch.branchUniqueId===assigned.branchUniqueId))this.form.patchValue({pickUpBranch:assigned.branchUniqueId});
  this.syncPickupSelectors();
}
onFromcitySelect(event:any){
  const city=String(event?.target?.value||'');
  if(this.form.get('fromCity')?.value!==city){this.form.patchValue({fromCity:city});return;}
  this.pdata=this.branchdata.filter(branch=>String(branch.city).trim().toLowerCase()===city.trim().toLowerCase());
  if(!this.pdata.some(branch=>branch.branchUniqueId===this.form.value.pickUpBranch))this.form.patchValue({pickUpBranch:''});
  this.syncPickupSelectors();this.fetchServiceCharges();
}
onPickupBranchSelect(event:any){
  const branch=this.pdata.find(row=>row.branchUniqueId===event?.target?.value);
  this.form.patchValue({pickUpBranch:branch?.branchUniqueId||''});
}
onDropBranchSelect(event:any){
  const branch=(this.tbcdata||[]).find((row:any)=>row.branchUniqueId===event?.target?.value);
  this.form.patchValue({dropBranch:branch?.branchUniqueId||''});
}
onTocitySelect(event: any) {


  const cityName = event.target.value;
  if (cityName) {
    this.api.GetBranchbyCity(cityName).subscribe(
      (res: any) => {


        this.tbcdata = res;
        this.fetchServiceCharges(); // Fetch service charges

      },
      (error: any) => {
        console.error('Error fetching branches:', error);
      }
    );
  } else {
    this.tbcdata = [];
  }

}



  get packages(): FormArray {
    return this.form.get('packages') as FormArray;
  }

  addOrderItem() {
    this.packages.push(
      this.fb.group({
        quantity: [1, Validators.required],
        packageType: ['', Validators.required],
        unitPrice: [0, Validators.required],
        contains: [''],
        weight: [],
        totalPrice: [0],
      })
    );
    this.calculateGrandTotal();
  }

  removeBarcodeData(index: number) {
    this.packages.removeAt(index);
    this.calculateGrandTotal();
  }

  roundMoney(value: any): number { return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100; }

  calculateTotal(index: number) {
    const packageArray = this.form.get('packages') as FormArray;
    const packageForm = packageArray.at(index);

    const quantity = packageForm.get('quantity')?.value || 0;
    const unitPrice = this.roundMoney(packageForm.get('unitPrice')?.value);

    const totalPrice = this.roundMoney(Number(quantity) * Number(unitPrice));
    packageForm.get('totalPrice')?.setValue(totalPrice);

    this.calculateGrandTotal();
  }

  calculateGrandTotal() {
    const packageArray = this.form.get('packages') as FormArray;

    // Calculate total price from all packages
    let totalValue = 0;
    packageArray.controls.forEach((pkg) => {
      totalValue += Number(pkg.get('totalPrice')?.value || 0);
    });

    // Get charges from form inputs
    const serviceCharges = this.roundMoney(this.form.get('serviceCharges')?.value);
    const hamaliCharges = this.roundMoney(this.form.get('hamaliCharges')?.value);
    const doorDeliveryCharges = this.roundMoney(this.form.get('doorDeliveryCharges')?.value);
    const doorPickupCharges = this.roundMoney(this.form.get('doorPickupCharges')?.value);

    // Calculate Grand Total
    const gst = this.roundMoney(this.form.get('parcelGstAmount')?.value);
    const grandTotal = this.form.value.bookingType === 'FOC' ? 0 : Math.round((totalValue + serviceCharges + hamaliCharges + doorDeliveryCharges + doorPickupCharges + gst) * 100) / 100;

    // Update Grand Total without triggering another event
    this.form.get('grandTotal')?.setValue(grandTotal, { emitEvent: false });
  }


  // openPreviewModal() {
  //   if (this.form.valid) {
  //     this.modelData = { ...this.form.value };  // Copy form values into modelData
  //   } else {
  //     this.toastr.warning("Please fill all required fields", "Warning");
  //   }
  // }



  openPreviewModal() {
    if (this.form.valid) {
      const orderDataToSend = this.packages.value.map((item: any) => ({
        quantity: item.quantity,
        packageType: item.packageType,
        contains: item.contains,
        weight: item.weight,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      }));

      const pickupBranchId = this.form.value.pickUpBranch;
      const dropBranchId = this.form.value.dropBranch;

      const pickupBranchName = this.pdata.find((b: any) => b.branchUniqueId === pickupBranchId)?.name || "N/A";
      const dropBranchName = this.tbcdata.find((b: any) => b.branchUniqueId === dropBranchId)?.name || "N/A";

      this.modelData = {
        fromCity: this.form.value.fromCity,
        toCity: this.form.value.toCity,
        pickUpBranch: pickupBranchId,
        dropBranch: dropBranchId,
        pickUpBranchName: pickupBranchName,
        dropBranchName: dropBranchName,
        dispatchType: this.form.value.dispatchType,
        bookingType: this.form.value.bookingType,
        senderName: this.form.value.senderName,
        senderMobile: this.form.value.senderMobile,
        senderAddress: this.form.value.senderAddress,
        senderGst: this.form.value.senderGST || "",
        receiverName: this.form.value.receiverName,
        receiverMobile: this.form.value.receiverMobile,
        receiverAddress: this.form.value.receiverAddress,
        receiverGst: this.form.value.receiverGst || "",
        packages: orderDataToSend,
        serviceCharges: this.form.value.serviceCharges,
        parcelGstAmount: this.form.value.parcelGstAmount,
        hamaliCharges: this.form.value.hamaliCharges,
        doorDeliveryCharges: this.form.value.doorDeliveryCharges,
        doorPickupCharges: this.form.value.doorPickupCharges,
        valueOfGoods: this.form.value.valueOfGoods,
        grandTotal: this.form.value.grandTotal,
        agent:this.form.value.agent
      };

      // Then open modal using Bootstrap JS if needed (or it's already bound by button trigger)

    } else {
      this.toastr.warning("Please fill all required fields before previewing.", "Form Incomplete");
    }
  }


  confirmBooking() {
    this.add();
  }
  add() {


    if (this.form.valid) {
      const orderDataToSend = this.packages.value.map((item: any) => ({
        quantity: item.quantity,
        packageType: item.packageType,
        contains: item.contains,
        weight: item.weight,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      }));
      const pickupBranchId = this.form.value.pickUpBranch;
    const dropBranchId = this.form.value.dropBranch;

    // Find branch names by ID
    const pickupBranchName = this.pdata.find((b: any) => b.branchUniqueId === pickupBranchId)?.name || "N/A";
    const dropBranchName = this.tbcdata.find((b: any) => b.branchUniqueId === dropBranchId)?.name || "N/A";

      const val: any = {
        fromCity: this.form.value.fromCity,
        toCity: this.form.value.toCity,
        pickUpBranchName: pickupBranchName,
        dropBranchName: dropBranchName,
        pickUpBranch: this.form.value.pickUpBranch || "N/A",
        dropBranch: this.form.value.dropBranch,
        dispatchType: this.form.value.dispatchType,
        bookingType: this.form.value.bookingType,
        senderName: this.form.value.senderName,
        senderMobile: this.form.value.senderMobile,
        senderAddress: this.form.value.senderAddress,
        senderGst: this.form.value.senderGST || "",  // Default empty string
        receiverName: this.form.value.receiverName,
        receiverMobile: this.form.value.receiverMobile,
        receiverAddress: this.form.value.receiverAddress,
        receiverGst: this.form.value.receiverGst || "",  // Default empty string
        packages: orderDataToSend,
        serviceCharges: this.form.value.serviceCharges,
        parcelGstAmount: this.form.value.parcelGstAmount,
        hamaliCharges: this.form.value.hamaliCharges,
        doorDeliveryCharges: this.form.value.doorDeliveryCharges,
        doorPickupCharges: this.form.value.doorPickupCharges,
        valueOfGoods: this.form.value.valueOfGoods,
        grandTotal: this.form.value.grandTotal,
        agent:this.form.value.agent
      };



      this.modelData = val;

      this.api.createBooking(val).subscribe(
        (response: any) => {


          if (response?.data?.grnNo) {
            this.gdata = response.data;

            this.toastr.success("Parcel Booked Successfully", "Success");
              this.billing?.load();
            // this.router.navigateByUrl(`/printgrn/${this.gdata.grnNo}`);
            this.router.navigateByUrl(`/printgrn/${this.gdata.grnNo}`).then(() => {
              window.location.reload();
            });



          } else {
            console.error("❌ Error: grnNo not found in response.");
            this.toastr.warning("Booking successful, but grnNo is missing.", "Warning");
          }
        },
        (error) => {
          console.error("❌ Error saving order:", error);
          this.toastr.error(error.error?.message || "Failed to book the parcel. Please try again.", error.status === 402 ? "Upgrade required" : "Error");
        }
      );
    }
  }


  searchUser(): void {
    const searchTerm = this.form.get('senderName')?.value?.trim();
    if (searchTerm) {
      this.api.searchUser(searchTerm).subscribe(
        (res: any) => {

          this.userList = res.length ? res : [];
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
       console.log('sender-address:', this.form.get('senderAddress')?.value);
       console.log('sender-address:', this.form.get('senderMobile')?.value);


    this.showDropdown = false;

  }

  hideDropdown(): void {
    setTimeout(() => {
      this.showDropdown = false;
    }, 200); // Small delay to allow selection click
  }



  toggleSameAsSender(event: any) {
    if (event.target.checked) {
      this.form.patchValue({
        receiverName: this.form.value.senderName,
        receiverMobile: this.form.value.senderMobile,
        receiverAddress: this.form.value.senderAddress,
        receiverGst: this.form.value.senderGST,
      });
    } else {
      this.form.patchValue({
        receiverName: '',
        receiverMobile: '',
        receiverAddress: '',
        receiverGst: '',
      });
    }
  }

  getAllCompany(): void {
    this.api.GetcfmasterData().subscribe(
      (res: any) => {
        this.companyList = res.data

      },
      (err: any) => {
        console.error('Error fetching company data:', err);
      }
    );
  }

  onCompanySelect(event: any): void {
    const selectedCompanyName = event.target.value;

    const selectedCompany = this.companyList.find(
      (company: { name: string }) => company.name === selectedCompanyName
    );

    if (selectedCompany) {
      this.form.patchValue({
        senderName: selectedCompany.senderName || '',
        senderMobile: selectedCompany.senderMobile || '',
        senderAddress: selectedCompany.address || '',
        senderGST: selectedCompany.gst || ''

      });

    }
  }



}
