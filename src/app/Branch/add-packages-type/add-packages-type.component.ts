import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder,FormGroup,FormsModule,ReactiveFormsModule,Validators } from '@angular/forms';
import { ActivatedRoute,Router,RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { BranchService } from 'src/app/service/branch.service';
import { HeaderComponent } from "../../USER/header/header.component";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, DialogModule, ToastModule, ButtonModule, HeaderComponent],
  selector: 'app-add-packages-type',
  templateUrl: './add-packages-type.component.html',
  styleUrls: ['./add-packages-type.component.scss'],
})
export class AddPackagesTypeComponent {

   form:FormGroup;
   form1:FormGroup;
    branchdata:any;
    data:any;
    loading:boolean=true;
    id:any;
    ubdata:any;
    errorsMessage:string='';
    msg:string='';
    visible: boolean = false;
    repd:any;
    showDialog(row:any) {
        this.visible = true;
        this.repd=row;
    }
    constructor(private fb:FormBuilder, private api:BranchService,
      private messageService:MessageService, private router:Router,
      private bapi:BranchService, private activeroute:ActivatedRoute, private toast:ToastrService){
        this.form = this.fb.group({
          name: ['', Validators.required],
            });
            this.form1 = this.fb.group({
              name: ['', Validators.required],
                });
    }

    ngOnInit(){
      this.bapi.GetPAckagesType().subscribe((res:any)=>{

        this.data=res;
        this.loading=false;
      })

    }



    // Add() {
    //   const payload = {
    //     name: this.form.value.name,
    //   };
    //   console.log('Final Payload:', payload);
    //   this.api.packageType(payload).subscribe({
    //     next: (response: any) => {
    //       console.log('Parcel loaded successfully:', response);
    //       // this.toast.success

    //       setTimeout(() => {
    //        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
    //          this.router.navigate(['/addpackagestype']);
    //        });
    //      }, 500);
    //     },
    //     error: (error: any) => {
    //       console.error('Create Packages Type failed:', error);
    //       alert('Create Packages Type Failed. Please try again.');
    //     },
    //   });
    // }
    Add() {
      const payload = {
        name: this.form.value.name,
      };


      this.api.packageType(payload).subscribe({
        next: (response: any) => {


          // ✅ Show success message from backend in toast
          this.toast.success(response?.message || 'Package type created successfully');

          // Navigate after short delay
          setTimeout(() => {
            this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
              this.router.navigate(['/addpackagestype']);
            });
          }, 500);
        },
        error: (error: any) => {
          console.error('Create Packages Type failed:', error);

          // ✅ Show error message from backend if available
          this.toast.error(error?.error?.message || 'Create Packages Type Failed. Please try again.');

        },
      });
    }


    edit(id: any) {


      if (this.form1.valid) {
        const val = {
          name: this.form1.value.name,
        };

        this.api.UpdatePackagestype(id, val).subscribe({
          next: (response: any) => {
            if (response?.data) {

              this.toast.success(response.message || 'Package type updated successfully');

              setTimeout(() => {
                this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                  this.router.navigate(['/addpackagestype']);
                });
              }, 1000);
            } else {
              // Fallback case (rare)

              this.toast.success('Packages Type Successfully Updated !!!');
            }
          },
          error: (err: any) => {
            console.error(err);
            this.toast.error(err?.error?.message || 'Package type update failed. Please try again.');
            this.errorsMessage = err?.error?.message || 'Unknown error';
          }
        });
      }

      return false;
    }


    Delete(id:any) {
      this.api.DeletePackagesType(id).subscribe(
        (a: any) => {
          if (a) {

            this.toast.success(a?.message || 'Package type deleted successfully');
            setTimeout(() => {
              this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                this.router.navigate(['/addpackagestype']);
              });
              }, 1000);
          } else {

            // this.errorMessage = a.msg.message;
            this.msg = 'Products Successfully Updated !!!';
          }
        },
        (err: any) => {
          this.messageService.add({ severity: 'error', summary: 'error', detail: 'Delete Packages Type Somthing wrong' });
        },
      );
    return false;
  }





}
