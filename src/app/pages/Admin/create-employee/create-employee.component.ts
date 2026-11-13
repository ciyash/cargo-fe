import { DomesticPhoneDirective } from '../../../shared/domestic-phone.directive';
import { citiesForBranches, branchesForCity, cityForBranch } from '../../../service/branch-options';
import { ROLE_OPTIONS, WORK_PERMISSIONS, roleLabel, normalizeRole, permissionsFor } from '../../../service/roles';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../../USER/header/header.component';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AdminService } from 'src/app/service/admin.service';
import { AuthService } from 'src/app/service/auth.service';
import { BranchService } from 'src/app/service/branch.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  standalone: true,
  imports: [DomesticPhoneDirective, CommonModule, FormsModule, ReactiveFormsModule, RouterModule, HeaderComponent, DialogModule, ToastModule],
  selector: 'app-create-employee',
  templateUrl: './create-employee.component.html',
  styleUrls: ['./create-employee.component.scss']
})
export class CreateEmployeeComponent {
  get cityChoices(){return citiesForBranches(this.branchdata||[]);}
  accountBranches(form:FormGroup){return branchesForCity(this.branchdata||[],form.value.branchCity);}
  branchTrack=(_:number,b:any)=>b._id;
  roleOptions=ROLE_OPTIONS;workPermissions=WORK_PERMISSIONS;roleLabel=roleLabel;
  setPermission(form:FormGroup,key:string,event:Event){const values:string[]=form.get('permissions')?.value||[];form.get('permissions')?.setValue((event.target as HTMLInputElement).checked?[...new Set([...values,key])]:values.filter(p=>p!==key));}


   form:FormGroup;
    branchdata:any;
    edata:any;
    loading:boolean=true;
    form1:FormGroup;
    visible: boolean = false;
    repd:any;
    constructor(private fb:FormBuilder, private api:AdminService,
       private messageService:MessageService, private router:Router,
        private bapi:BranchService, private auth:AuthService, private toastr: ToastrService){
        this.form = this.fb.group({
          name: ['', Validators.required],
          username: ['', Validators.required],
          branchCity:[''],
          branchId: [''],
          location: ['', Validators.required],
          password: ['', Validators.required],
          phone: ['', Validators.required],
          email: ['', Validators.required],
          documents: ['', Validators.required],
          role: ['staff', Validators.required],
          permissions: [['bookings']],
          // companyName:['', Validators.required],
            });

            this.form1 = this.fb.group({
              name: ['', Validators.required],
              username: ['', Validators.required],
              branchCity:[''],
          branchId: [''],
              location: ['', Validators.required],
              password: ['', Validators.required],
              phone: ['', Validators.required],
              email: ['', Validators.required],
              documents: ['', Validators.required],
              role: ['staff', Validators.required],
          permissions: [['bookings']],
              companyName:[''],

                });
    }
    ngOnInit(){
      for(const form of [this.form,this.form1]){
        const updateBranch=(role:string)=>{for(const key of ['branchCity','branchId']){const control=form.get(key);control?.setValidators(role==='company_admin'?[]:[Validators.required]);control?.updateValueAndValidity({emitEvent:false});}if(role==='company_admin')form.patchValue({branchCity:'',branchId:''});};
        form.get('branchCity')?.valueChanges.subscribe(()=>form.patchValue({branchId:''}));updateBranch(form.value.role);form.get('role')?.valueChanges.subscribe(updateBranch);
      }

      this.branchData();

      this.api.GetEmployees().subscribe((res: any) => {
        console.log('empdata', res);
        this.edata = res.map((employee: any) => {
          employee.showPassword = false; // Initialize show/hide
          return employee;
        });
        this.loading = false;
      });
    }

  showDialog(row: any) {
    this.visible = true;
    this.repd = row;
    console.log("employeedata:", this.repd);

    this.form1.patchValue({
      name: row.name,
      username: row.username,
      branchCity:cityForBranch(this.branchdata||[],row.branchId?._id),
      branchId: row.branchId?._id || '', // Assuming branchId is an object
      location: row.location,
      password: row.password,
      phone: row.phone,
      email: row.email,
      documents: Array.isArray(row.documents) ? row.documents.join(', ') : row.documents,
      role: normalizeRole(row.role),
      permissions: permissionsFor(row),
      companyName: row.companyId?.name || ''
    });
  }

    togglePassword(index: number) {
      this.edata[index].showPassword = !this.edata[index].showPassword;
    }


    branchData() {
      this.bapi.getData('branch').subscribe({
        next: (response: any) => {
          console.log('Branch Data:', response);
          this.branchdata = response;
        },
        error: (error: any) => {
          console.error('Error fetching branch data:', error);
        }
      });
    }


    Add() {
      const payload = {
        name: this.form.value.name,
        username: this.form.value.username,
        branchCity:this.form.value.branchCity,
        branchId: this.form.value.role==='company_admin'?null:this.form.value.branchId,
        location: this.form.value.location,
        password: this.form.value.password,
        phone: this.form.value.phone,
        email: this.form.value.email,
        documents: this.form.value.documents,
        role: this.form.value.role,
        permissions: this.form.value.role==='staff'?this.form.value.permissions:undefined,
        // companyName:this.form.value.companyName
      };
      this.api.createEmployee(payload).subscribe({
        next: (response: any) => {
          console.log('Parcel loaded successfully:', response);
          this.toastr.success('Staff account created', 'Success');

          // this.messageService.add({ severity: 'success', summary: 'success', detail: 'Create Employee successfully' });
          setTimeout(() => {
           this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
             this.router.navigate(['/createemployee']);
           });
         }, 500);
        },
        error: (error: any) => {
          console.error('Create Employee failed:', error);
          alert('Create Employee Failed. Please try again.');
        },
      });
    }

    // edit(id:any) {
    //   const payload = {
    //     name: this.form.value.name,
    //     username: this.form.value.username,
    //     branchId: this.form.value.branchId,
    //     location: this.form.value.location,
    //     password: this.form.value.password,
    //     phone: this.form.value.phone,
    //     email: this.form.value.email,
    //     documents: this.form.value.documents,
    //     role: this.form.value.role,
    //     companyName:this.form1.value.companyName
    //   };

    //   console.log('Final Payload:', payload);

    //   this.api.UpdateEmployee(id,payload).subscribe({
    //     next: (response: any) => {
    //       console.log('Parcel loaded successfully:', response);
    //       this.toastr.success('Staff account created', 'Success');

    //       // this.messageService.add({ severity: 'success', summary: 'success', detail: 'Create Employee successfully' });
    //       setTimeout(() => {
    //        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
    //          this.router.navigate(['/createemployee']);
    //        });
    //      }, 500);
    //     },
    //     error: (error: any) => {
    //       console.error('Create Employee failed:', error);
    //       alert('Create Employee Failed. Please try again.');
    //     },
    //   });
    // }

    edit() {
      const payload = {
        id: this.repd._id,
        name: this.form1.value.name,
        username: this.form1.value.username,
        branchCity:this.form1.value.branchCity,
        branchId: this.form1.value.role==='company_admin'?null:this.form1.value.branchId,
        location: this.form1.value.location,
        password: this.form1.value.password,
        phone: this.form1.value.phone,
        email: this.form1.value.email,
        documents: this.form1.value.documents,
        role: this.form1.value.role,
        permissions: this.form1.value.role==='staff'?this.form1.value.permissions:undefined,
        companyName: this.form1.value.companyName
      };
      this.api.UpdateEmployee(payload).subscribe({
        next: (response: any) => {
          console.log('Employee updated successfully:', response);
          this.toastr.success('Employee updated successfully', 'Success');

          setTimeout(() => {
            this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
              this.router.navigate(['/createemployee']);
            });
          }, 500);
        },
        error: (error: any) => {
          console.error('Update Employee failed:', error);
          alert('Update Employee Failed. Please try again.');
        },
      });
    }

}
