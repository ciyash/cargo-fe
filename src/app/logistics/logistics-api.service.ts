import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TokenService } from '../service/token.service';
@Injectable({providedIn:'root'})
export class LogisticsApi {
  readonly base=environment.baseUrl.replace(/\/+$/,'');
  constructor(private http:HttpClient,private token:TokenService,private zone:NgZone){}
  private headers(extra:Record<string,string>={}){return new HttpHeaders({Authorization:'Bearer '+this.token.getToken(),...extra});}
  get<T=any>(path:string,params:Record<string,any>={}){let query=new HttpParams();Object.entries(params).forEach(([k,v])=>{if(v!==''&&v!==null&&v!==undefined)query=query.set(k,String(v));});return firstValueFrom(this.http.get<T>(this.base+path,{headers:this.headers(),params:query}));}
  post<T=any>(path:string,body:any={},key?:string){return firstValueFrom(this.http.post<T>(this.base+path,body,{headers:this.headers(key?{'Idempotency-Key':key}:{})}));}
  patch<T=any>(path:string,body:any){return firstValueFrom(this.http.patch<T>(this.base+path,body,{headers:this.headers()}));}
  async context(){const context=await this.get('/workspace/context');if(context.user?.role)this.token.saveUser({...this.token.getUser(),role:context.user.role,permissions:context.user.permissions});return context;}
  error(error:any){return error?.error?.message||error?.message||'Request failed. Please try again.';}
  async document(bookingId:string,document:any){const blob=await firstValueFrom(this.http.get(this.base+'/workspace/bookings/'+bookingId+'/documents/'+document._id,{headers:this.headers(),responseType:'blob'}));const url=URL.createObjectURL(blob);const a=window.document.createElement('a');a.href=url;a.download=document.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  private loadCheckout(){if((window as any).Razorpay)return Promise.resolve();return new Promise<void>((resolve,reject)=>{const script=document.createElement('script');script.src='https://checkout.razorpay.com/v1/checkout.js';script.onload=()=>resolve();script.onerror=()=>{script.remove();reject(Error('Checkout could not load. Please retry.'));};document.head.appendChild(script);});}
  async pay(purpose:'booking-pack'|'service',providerKey?:string){
    await this.loadCheckout();const order=await this.post('/billing/orders',{purpose,providerKey});
    const result=await new Promise<any>((resolve,reject)=>{const checkout=new (window as any).Razorpay({key:order.keyId,order_id:order.orderId,amount:order.amount,currency:order.currency,name:'Ciyash',description:purpose==='service'?'Company courier service enablement':order.bookings+' company bookings',handler:(r:any)=>this.zone.run(()=>resolve(r)),modal:{ondismiss:()=>this.zone.run(()=>reject(Error('Checkout closed. If charged, check the payment history before paying again.')))}});checkout.on('payment.failed',()=>this.zone.run(()=>reject(Error('Payment was not confirmed. Check payment status before another attempt.'))));checkout.open();});
    return this.post('/billing/verify',result);
  }
}
