import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder,FormGroup,FormsModule,ReactiveFormsModule,Validators } from '@angular/forms';
import { Router,RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { AdminService } from 'src/app/service/admin.service';
import { FooterComponent } from '../../../USER/footer/footer.component';
import { HeaderComponent } from '../../../USER/header/header.component';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, HeaderComponent, FooterComponent, DialogModule, ButtonModule],
  selector: 'app-add-dispatch-type',
  templateUrl: './add-dispatch-type.component.html',
  styleUrls: ['./add-dispatch-type.component.scss']
})
export class AddDispatchTypeComponent {

          data:any;
          form:FormGroup;
          loading:boolean=true;
          msg='';
          errorsMessage='';
          form1:FormGroup;
          visible: boolean = false;
          repd:any;
          showDialog(row:any) {
              this.visible = true;
              this.repd=row;
          }
          constructor(private fb:FormBuilder, private api:AdminService, private messageService:MessageService, private router:Router ,private toastr:ToastrService ){
              this.form = this.fb.group({
                name: ['', Validators.required],
                  });

                  this.form1 = this.fb.group({
                    name: ['', ],
                      });
          }

          ngOnInit(){
            this.api.GetDispatchtypeData().subscribe((res:any)=>{

                this.data=res;
                this.loading=false;
            })
          }

          Add() {
            const payload = {
              name: this.form.value.name,
            };



            this.api.createdispatch(payload).subscribe({
              next: (response: any) => {

                this.toastr.success('Create Dispatch Type successfully', 'Success');

                setTimeout(() => {
                 this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                   this.router.navigate(['/adddispatchtype']);
                 });
               }, 500);
              },
              error: (error: any) => {
                console.error('Create Dispatch type failed:', error);
                // alert('Create City Failed. Please try again.');
                this.toastr.error('Create Dispatch Failed!', 'Error');

              },
            });
          }

          edit(id:any) {

            if (this.form1.valid) {
              const val = {
                name: this.form1.value.name,
              };
              this.api.Updatedispatch(id, val).subscribe(
                (a: any) => {
                  if (a?.data) {

                  } else {

                    // this.errorMessage = a.msg.message;
                    this.msg = 'adddispatchtype Successfully Updated !!!';
                    setTimeout(() => {
                      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                        this.router.navigate(['/adddispatchtype']);
                      });
                      }, 1000);
                  }
                },
                (err: any) => {
                  this.messageService.add({ severity: 'error', summary: 'error', detail: 'adddispatchtype not added' });
                  this.errorsMessage = err.error.message;
                },
              );
            }

            return false;
          }

          Delete(id:any) {
            this.api.Deletedispatch(id).subscribe(
              (a: any) => {
                if (a) {

                  setTimeout(() => {
                    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                      this.router.navigate(['/adddispatchtype']);
                    });
                    }, 1000);
                } else {

                  // this.errorMessage = a.msg.message;
                  this.msg = 'adddispatchtype Successfully Updated !!!';
                }
              },
              (err: any) => {
                this.messageService.add({ severity: 'error', summary: 'error', detail: 'Delete adddispatchtype Type Somthing wrong' });
              },
            );
          return false;
        }

}
