Deno.serve(()=>new Response(JSON.stringify({ok:false,message:'API ongkir belum dikonfigurasi.'}),{status:501,headers:{'content-type':'application/json'}}));
