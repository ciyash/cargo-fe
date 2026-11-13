import { CompanyLogoComponent } from '../../shared/company-logo/company-logo.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Component, OnInit, HostListener } from '@angular/core';
import { ServiceService } from 'src/app/service.service';
import { BranchService } from 'src/app/service/branch.service';
import { TokenService } from 'src/app/service/token.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  standalone: true,
  imports: [CompanyLogoComponent, CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  get homeRoute() {
    if(this.token.isCompany())return '/create-admin';
    if (this.token.isAdmin()) return '/dashboard';
    switch (this.token.getRole()) {
      case 'company_admin': return '/dashboard';
      case 'admin': return '/dashboard';
      case 'staff': return '/booking';
      case 'accountant': return '/reports';
      case 'superviser': return '/tasks';
      case 'driver': return '/delivery';
      default: return '/login';
    }
  }
  get profileRoute() { return this.token.isCompany() ? '/create-admin' : this.token.isAdmin() ? '/adminprofile' : '/profile'; }
  profileOpen = false;
  isCompanyAccount = false;
  openMenu: number | null = null;
  mobileOpen = false;
  closeMenus() { this.openMenu = null; this.mobileOpen = false; this.profileOpen = false; }
  toggleMenu(index: number) { this.profileOpen = false; this.openMenu = this.openMenu === index ? null : index; }
  toggleProfile() { this.profileOpen = !this.profileOpen; this.openMenu = null; this.mobileOpen = false; }
  toggleMobile() { this.mobileOpen = !this.mobileOpen; this.profileOpen = false; this.openMenu = null; }
  menuLabel(label: string) { return (label || '').replace(/[^a-zA-Z0-9 /&()-]/g,'').trim(); }
  linkActive(item: any) { const [path, fragment] = this.router.url.split('#'); return item.routerLink?.[0] === path.split('?')[0] && (item.fragment || '') === (fragment || ''); }
  groupActive(item: any) { return !!item.items?.some((child: any) => child.routerLink?.[0] === this.router.url.split('?')[0]); }
  @HostListener('document:click', ['$event'])
  outsideClick(event: MouseEvent) { if (!(event.target as Element)?.closest?.('app-header')) this.closeMenus(); }
  model: any[] = [];
  id: any;
  data: any;

  constructor(
    private router: Router,
    public token: TokenService,
    private api: BranchService,
    private activeroute: ActivatedRoute
  ) {}

  logout() {
    this.token.signOut();
  }

  ngOnInit() {
    this.model = [];
    this.isCompanyAccount = this.token.isCompany();
    if(this.isCompanyAccount){
      const company=this.token.getUser()?.company;
      this.data={companyId:company,name:company?.customerName||company?.name||'Company account',role:'company_admin'};
      this.model=[
        {label:'Overview',icon:'pi pi-home',routerLink:['/create-admin'],fragment:'overview'},
        {label:'Company logo',icon:'pi pi-palette',routerLink:['/create-admin'],fragment:'company-brand'},
        {label:'Subscription & payments',icon:'pi pi-credit-card',routerLink:['/create-admin'],fragment:'company-billing'},
        {label:'Branches',icon:'pi pi-building',routerLink:['/create-admin'],fragment:'company-branches'},
        {label:'Admins & team',icon:'pi pi-users',routerLink:['/create-admin'],fragment:'company-team'},
      ];
      return;
    }
    if (this.token.isAdmin()) {
      this.model = [
        {
          label: 'Dashboard',
          icon: 'pi pi-fw pi-home',
          routerLink: ['/dashboard'],
        },

        {
          label: 'Bookings ▼',
          icon: 'pi pi-fw pi-database',
          items: [
            { label: 'Parcel Booking', routerLink: ['/booking'] },
            { label: 'Offline Loading', routerLink: ['/parcelloading'] },
            { label: 'Parcel Unloading', routerLink: ['/parcelunloading'] },
            { label: 'Branch to Branch Loading', routerLink: ['/parcel-branch'] },
            { label: 'Parcel Delivery', routerLink: ['/parcel-delivery'] },
            { label: 'Cancel Booking', routerLink: ['/cancel-booking'] },
            { label: 'Parcel Status Details', routerLink: ['/gnrnumberstatus'] },
            { label: 'Branch to Branch Unloading', routerLink: ['/barnchtobranchunloading'] },
            { label: 'Vouchers List Offline', routerLink: ['/voucherslistoffline'] },
          ]
        },

        {
          label: 'Credit Accounts ▼',
          icon: 'pi pi-fw pi-file',
          items: [
            { label: 'Credit Parties', routerLink: ['/getcfmasterdata'] },
            { label: 'Generate Credit Statement', routerLink: ['/creditvouchergenerate'] },
            { label: 'Credit Statements', routerLink: ['/voucherdetailscf'] },
          ],
        },
        {
          label: 'Parcel Report ▼',
          icon: 'pi pi-fw pi-database',
          items: [
            { label: 'Today Booking Report', routerLink: ['/bookingreport'] },
            { label: 'Booking Report ', routerLink: ['/reportsdashboard'] },
            { label: 'Collection Report', routerLink: ['/collectionreport'] },
            { label: 'Consolidated Report', routerLink: ['/Consolidate'] },
            // { label: 'GST Report', routerLink: ['/gdtreport'] },
            { label: 'Status Date Different Report', routerLink: ['/parcelstatusdate'] },
            { label: 'Pending Delivery Stock Report ', routerLink: ['/pending-delivery'] },
            { label: 'Pending Delivery Luggage Report', routerLink: ['/pendingluggage'] },
            { label: 'Dispatched Stock Report', routerLink: ['/dispatchedreport'] },
            { label: 'Received Stock Report', routerLink: ['/receivedstock-report'] },
            { label: 'Delivered Report', routerLink: ['/report-delivery'] },
            { label: 'Pending Dispatched Stock Report', routerLink: ['/pending-dispatchedStock-report'] },
            { label: 'Dispatched Memo Report', routerLink: ['/dispacthed-memo-report'] },
            { label: 'Parcel Incoming Report', routerLink: ['/incoming-report'] },
          ],
        },
        // {
        //   label: 'Others ▼',
        //   icon: 'pi pi-fw pi-database',
        //   items: [
        //     { label: 'Add Package Type', icon: 'pi pi-fw pi-user-edit', routerLink: ['/addpackagetype'] },
        //   ]
        //  },






        {
          label: 'Create Data ▼',
          icon: 'pi pi-user',
          items: [
            {
              label: 'Add Branch',
              icon: 'pi pi-user-edit',
              routerLink: ['/createbranch'],
            },
            {
              label: 'Team & permissions',
              icon: 'pi pi-fw pi-user-edit',
              routerLink: ['/createemployee'],
            },
            {
              label: 'Add Vehicle',
              icon: 'pi pi-fw pi-user-edit',
              routerLink: ['/createvehicle'],
            },
          ],
        },

        {
          // label: 'Setting',
          label: 'Others ▼',
          icon: 'pi pi-fw pi-database',
          items: [
            { label: 'Profile', routerLink: ['/adminprofile'] },
            { label: 'Add City', icon: 'pi pi-fw pi-user-edit', routerLink: ['/createcity'] },
            { label: 'Add Dispatch Type', icon: 'pi pi-fw pi-user-edit', routerLink: ['/adddispatchtype']},
            { label: 'Add Charges', icon: 'pi pi-fw pi-user-edit', routerLink: ['/addextracharges'] },
            { label: 'Add Package Type', icon: 'pi pi-fw pi-user-edit', routerLink: ['/addpackagetype'] },
          ],
        },
              {
          label: 'Setting ▼',
          icon: 'pi pi-fw pi-database',
          // items: [
          //   { label: 'Add Package Type', icon: 'pi pi-fw pi-user-edit', routerLink: ['/addpackagetype'] },
          // ]
         },
      ];
    }

    if (this.token.isEmployee()) {
      this.model = [
        // {
        //   label: 'Dashboard',
        //   icon: 'pi pi-fw pi-home',
        //   routerLink: ['/employee-dashboard'],
        // },
        {
          label: 'Bookings ▼',
          icon: 'pi pi-fw pi-database',
          items: [
            { label: 'Parcel Booking', routerLink: ['/employee-booking'] },
            { label: 'Offline Loading', routerLink: ['/employee-loading'] },
            { label: 'Parcel Unloading', routerLink: ['/employee-unloading'] },
            { label: 'Branch to Branch Loading', routerLink: ['/employee-branch-loading'] },
            { label: 'Parcel Delivery', routerLink: ['/employee-parcel-devlivery'] },
            { label: 'Cancel Booking', routerLink: ['/employee-parcel-cancel'] },
            { label: 'Parcel Status Details', routerLink: ['/employee-status'] },
            { label: 'Branch to Branch Unloading', routerLink: ['/employee-branch-unloading'] },
            { label: 'Vouchers List Offline', routerLink: ['/employee-voucherdetails'] },
          ]
        },
        {
          label: 'Credit Accounts ▼',
          icon: 'pi pi-fw pi-file',
          items: [
            { label: 'Credit Parties', routerLink: ['/getcfmasterdata'] },
            { label: 'Generate Credit Statement', routerLink: ['/creditvouchergenerate'] },
            { label: 'Credit Statements', routerLink: ['/voucherdetailscf'] },
          ],
        },
        {
          label: 'Parcel Report ▼',
          icon: 'pi pi-fw pi-database',
          items: [
            { label: 'Today Booking Report', routerLink: ['/todaybooking'] },
            { label: 'Booking Report ', routerLink: ['/dashboard-report'] },
            { label: 'Collection Report', routerLink: ['/collection-report'] },
            { label: 'Consolidated Report', routerLink: ['/conslidated-report'] },
            // { label: 'GST Report', routerLink: ['/gdtreport'] },
            { label: 'Status Date Different Report', routerLink: ['/parcel-status'] },
            { label: 'Pending Delivery Stock Report ', routerLink: ['/pending-deliverystock'] },
            { label: 'Pending Delivery Luggage Report', routerLink: ['/pending-luggage'] },
            { label: 'Dispatched Stock Report', routerLink: ['/dispacthedstock-report'] },
            { label: 'Received Stock Report', routerLink: ['/received-stock'] },
            { label: 'Delivered Report', routerLink: ['/deliverystock-report'] },
            { label: 'Pending Dispatched Stock Report', routerLink: ['/pendingdispached-stock-report'] },
            { label: 'Dispatched Memo Report', routerLink: ['/memo-stock-report'] },
            { label: 'Parcel Incoming Report', routerLink: ['/incomingreport'] },
          ],
        },

        {
          label: 'Profile',
          icon: 'pi pi-fw pi-user-edit',
          routerLink: ['/aprofile'],
        },

      ];
    }

    if (this.token.isSubAdmin()) {
      this.model = [
        { label: 'Dashboard', icon: 'pi pi-home', routerLink: ['/dashboard'] },
        // {
        //   label: 'Dashboard',
        //   icon: 'pi pi-database',
        //   routerLink: ['/sub-dashboard'],
        // },
        {
          label: 'Bookings ▼',
          icon: 'pi pi-fw pi-database',
          items: [
            { label: 'Parcel Booking', routerLink: ['/sub-booking'] },
            { label: 'Offline Loading', routerLink: ['/sub-loading'] },
            { label: 'Parcel Unloading', routerLink: ['/sub-unloading'] },
            { label: 'Branch to Branch Loading', routerLink: ['/sub-branch-loading'] },
            { label: 'Parcel Delivery', routerLink: ['/parcel-delivery'] },
            { label: 'Cancel Booking', routerLink: ['/cancel-booking'] },
            { label: 'Parcel Status Details', routerLink: ['/gnrnumberstatus'] },
            { label: 'Branch to Branch Unloading', routerLink: ['/sub-branch-unloading'] },
            { label: 'Vouchers List Offline', routerLink: ['/sub-parcelvoucher-details'] },
          ]
        },

        {
          label: 'Credit Accounts ▼',
          icon: 'pi pi-fw pi-file',
          items: [
            { label: 'Credit Parties', routerLink: ['/getcfmasterdata'] },
            { label: 'Generate Credit Statement', routerLink: ['/creditvouchergenerate'] },
            { label: 'Credit Statements', routerLink: ['/voucherdetailscf'] },
          ],
        },
        {
          label: 'Parcel Report ▼',
          icon: 'pi pi-fw pi-database',
          items: [
            { label: 'Today Booking Report', routerLink: ['/sub-todaybooking'] },
            { label: 'Booking Report ', routerLink: ['/sub-dashboard'] },
            { label: 'Collection Report', routerLink: ['/sub-collection'] },
            { label: 'Consolidated Report', routerLink: ['/sub-consolidate'] },
            // { label: 'GST Report', routerLink: ['/gdtreport'] },
            { label: 'Status Date Different Report', routerLink: ['/sub-datedifferent'] },
            { label: 'Pending Delivery Stock Report ', routerLink: ['/sub-pendingdelivery'] },
            { label: 'Pending Delivery Luggage Report', routerLink: ['/sub-pendingluaggage'] },
            { label: 'Dispatched Stock Report', routerLink: ['/sub-dispatched'] },
            { label: 'Received Stock Report', routerLink: ['/sub-received'] },
            { label: 'Delivered Report', routerLink: ['/sub-deliverystock'] },
            { label: 'Pending Dispatched Stock Report', routerLink: ['/sub-pendingdispatch'] },
            { label: 'Dispatched Memo Report', routerLink: ['/sub-memo-dispathed'] },
            { label: 'Parcel Incoming Report', routerLink: ['/sub-incoming-luggage'] },
          ],
        },
        {
          label: 'Others ▼',
          icon: 'pi pi-fw pi-database',
          items: [
            { label: 'Add Package Type', icon: 'pi pi-fw pi-user-edit', routerLink: ['/addpackagetype'] },
          ]
         },
      ];
      // ;;

      // this.model = [//
      //   {
      //     label: 'Dashboard',
      //     icon: 'pi pi-database',
      //     routerLink: ['/booking'],
      //   },
      //   {
      //     label: 'Bookings ▼',
      //     icon: 'pi pi-fw pi-database',
      //     items: [
      //       { label: 'Parcel Booking', routerLink: ['/booking'] },
      //       { label: 'Offline Loading', routerLink: ['/parcelloading'] },
      //       { label: 'Parcel Unloading', routerLink: ['/parcelunloading'] },
      //       { label: 'Branch to Branch Loading', routerLink: ['/parcel-branch'] },
      //       { label: 'Parcel Delivery', routerLink: ['/parcel-delivery'] },
      //       { label: 'Cancel Booking', routerLink: ['/cancel-booking'] },
      //       { label: 'Parcel Status', routerLink: ['/gnrnumberstatus'] },
      //       { label: 'Branch to Branch Unloading', routerLink: ['/barnchtobranchunloading'] },
      //       { label: 'Vouchers List Offline', routerLink: ['/voucherslistoffline'] },
      //     ]
      //   },

      //   {
      //     label: 'Credit Accounts ▼',
      //     icon: 'pi pi-fw pi-file',
      //     items: [
      //       { label: 'Credit Parties', routerLink: ['/getcfmasterdata'] },
      //       { label: 'Generate Credit Statement', routerLink: ['/creditvouchergenerate'] },
      //       { label: 'Credit Statements', routerLink: ['/voucherdetailscf'] },
      //     ],
      //   },
      //   {
      //     label: 'Parcel Report ▼',
      //     icon: 'pi pi-fw pi-database',
      //     items: [
      //       { label: 'Today Booking Report', routerLink: ['/bookingreport'] },
      //       { label: 'Booking Report ', routerLink: ['/reportsdashboard'] },
      //       { label: 'Collection Report', routerLink: ['/collectionreport'] },
      //       { label: 'Consolidated Report', routerLink: ['/Consolidate'] },
      //       { label: 'GST Report', routerLink: ['/gdtreport'] },
      //       { label: 'Status Date Different Report', routerLink: ['/parcelstatusdate'] },
      //       { label: 'Pending Delivery Stock Report ', routerLink: ['/pending-delivery'] },
      //       { label: 'Pending Delivery Luggage Report', routerLink: ['/pendingluggage'] },
      //       { label: 'Dispatched Stock Report', routerLink: ['/dispatchedreport'] },
      //       { label: 'Received Stock Report', routerLink: ['/receivedstock-report'] },
      //       { label: 'Delivered Report', routerLink: ['/report-delivery'] },
      //       { label: 'Pending Dispatched Stock Report', routerLink: ['/pending-dispatchedStock-report'] },
      //       { label: 'Dispatched Memo Report', routerLink: ['/dispacthed-memo-report'] },
      //       { label: 'Parcel Incoming Report', routerLink: ['/incoming-report'] },
      //     ],
      //   },
      //   {
      //     label: 'Others ▼',
      //     icon: 'pi pi-fw pi-database',
      //     items: [
      //       { label: 'Add Package Type', icon: 'pi pi-fw pi-user-edit', routerLink: ['/addpackagetype'] },
      //     ]
      //    },
      // ];
    }


    if (this.token.isAccountant()) {
      this.model = [
        {
          label: 'Reports',
          icon: 'pi pi-fw pi-file',
          routerLink: ['/reports'],
        },
      ];
    }

    if (this.token.isSuperviser()) {
      this.model = [
        {
          label: 'Tasks',
          icon: 'pi pi-fw pi-briefcase',
          routerLink: ['/tasks'],
        },
      ];
    }

    if (this.token.isDriver()) {
      this.model = [
        {
          label: 'Delivery',
          icon: 'pi pi-fw pi-truck',
          routerLink: ['/delivery'],
        },
      ];
    }
    // Account navigation lives only in the user dropdown.
    this.model = this.model
      .filter(item => this.menuLabel(item.label).toLowerCase() !== 'profile')
      .map(item => item.items ? {...item, items: item.items.filter((child: any) => this.menuLabel(child.label).toLowerCase() !== 'profile')} : item);
    // Keep the booking entry and tracking list together for every role.
    this.model=this.model.map(item=>{
      if(!item.items||this.menuLabel(item.label).toLowerCase()!=='bookings')return item;
      const rest=item.items.filter((child:any)=>!['/booking','/sub-booking','/employee-booking','/workspace-booking','/workspace/bookings'].includes(child.routerLink?.[0]));
      return {...item,items:[{label:'Parcel Booking',routerLink:[this.token.isSubAdmin()?'/sub-booking':this.token.isEmployee()?'/employee-booking':'/booking']},...rest]};
    });
    if(this.token.isAdmin())this.model.push({label:'Settings',items:[{label:'Courier services',routerLink:['/courier-services']},{label:'Subscription & quota',routerLink:['/subscription']},{label:'Franchise allowances',routerLink:['/franchise-allowance']},{label:'Booking allowance ledger',routerLink:['/franchise-allowance']}]});
    else this.model.push({label:'Courier services',icon:'pi pi-truck',routerLink:['/courier-services']});
    // Keep setup links together while retaining the current role's allowed routes.
    const setupGroups = new Set(['create data', 'others', 'setting', 'settings']);
    const setupItems: any[] = [];
    this.model = this.model.filter(item => {
      if (!setupGroups.has(this.menuLabel(item.label).toLowerCase())) return true;
      setupItems.push(...(item.items || []));
      return false;
    });
    if (setupItems.length) {
      const seen = new Set<string>();
      this.model.push({
        label: 'Settings', icon: 'pi pi-cog',
        items: setupItems.filter(item => {
          const key = JSON.stringify(item.routerLink);
          if (seen.has(key)) return false;
          seen.add(key); return true;
        }),
      });
    }
    this.model = this.model.map(item => {
      if(!item.items)return item;
      const group=this.menuLabel(item.label).toLowerCase();
      const permission=group.includes('report')?'reports':(group.includes('agent')||group==='credit accounts')?'accounts':null;
      return {...item,items:item.items.filter((child:any)=>(!permission||this.token.can(permission))&&this.token.canAccessRoute(child.routerLink?.[0]||''))};
    }).filter(item=>item.items?item.items.length:this.token.canAccessRoute(item.routerLink?.[0]||''));
    if(this.token.isSubAdmin()&&this.token.can('team'))this.model.push({label:'Team',icon:'pi pi-users',routerLink:['/branch-staff']});
    // profile data
    this.id = this.activeroute.snapshot.params['id'];
    this.api.GetProfileData().subscribe((res: any) => {
      console.log(res);
      this.data = res;
      console.log(this.data, 'Profiledat');
    });
  }

  onKeydown(event: KeyboardEvent) {
    const nodeElement = event.target as HTMLDivElement;
    if (event.code === 'Enter' || event.code === 'Space') {
      nodeElement.click();
      event.preventDefault();
    }
  }
}
