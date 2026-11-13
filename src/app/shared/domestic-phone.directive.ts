import { Directive, ElementRef, forwardRef, Input, OnChanges, OnDestroy } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({selector:'input[domesticPhone]',standalone:true,providers:[{provide:NG_VALIDATORS,useExisting:forwardRef(()=>DomesticPhoneDirective),multi:true}]})
export class DomesticPhoneDirective implements Validator, OnChanges, OnDestroy {
  @Input() domesticPhone: boolean | string = true;
  @Input() phoneInputActive = true;
  private changed = () => {};
  private get domestic(){return this.domesticPhone !== false && this.domesticPhone !== 'false';}
  private input = () => {
    const element = this.element.nativeElement;
    if(this.phoneInputActive && this.domestic)element.value=element.value.replace(/\D/g,'').slice(0,10);
  };
  constructor(private element:ElementRef<HTMLInputElement>){
    // Capture before Angular's value accessor so pasted text and form values agree.
    element.nativeElement.addEventListener('input',this.input,true);
  }
  ngOnChanges(){
    if(!this.phoneInputActive){this.changed();return;}
    const element=this.element.nativeElement;
    element.type='tel';element.inputMode=this.domestic?'numeric':'tel';
    element.maxLength=this.domestic?10:16;
    this.changed();
  }
  validate(control:AbstractControl):ValidationErrors|null{
    if(!this.phoneInputActive||!this.domestic||control.value===null||control.value===undefined||control.value==='')return null;
    return /^\d{10}$/.test(String(control.value))?null:{domesticPhone:{requiredDigits:10}};
  }
  registerOnValidatorChange(fn:()=>void){this.changed=fn;}
  ngOnDestroy(){this.element.nativeElement.removeEventListener('input',this.input,true);}
}
