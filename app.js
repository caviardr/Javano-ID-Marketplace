
const RAW = window.JAVANO_MARKET_CONFIG || window.JAVANO_CONFIG || {};
const C = {
  SUPABASE_URL: RAW.SUPABASE_URL || "",
  SUPABASE_KEY: RAW.SUPABASE_PUBLISHABLE_KEY || RAW.SUPABASE_ANON_KEY || "",
  CS_WHATSAPP: RAW.CS_WHATSAPP || "6280000000000",
  POINT_TO_RUPIAH: Number(RAW.POINT_TO_RUPIAH || 1),
  MIN_WITHDRAW_RUPIAH: Number(RAW.MIN_WITHDRAW_RUPIAH || 100000)
};
const configured = !!(C.SUPABASE_URL && C.SUPABASE_KEY &&
  !C.SUPABASE_URL.includes("PASTE_") && !C.SUPABASE_KEY.includes("PASTE_"));
const sb = configured ? supabase.createClient(C.SUPABASE_URL, C.SUPABASE_KEY) : null;

const S = {
  page:"home", session:null, profile:null, products:[],
  cart: JSON.parse(localStorage.getItem("jvn_market_cart") || "[]")
};
const $ = s => document.querySelector(s);
const rp = n => "Rp " + Number(n||0).toLocaleString("id-ID");
const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[m]));
const maskNik = n => n ? String(n).replace(/^(.{2}).*(.{2})$/,"$1************$2") : "-";

function toast(msg){
  const e=$("#toast"); if(!e) return;
  e.textContent=msg; e.style.display="block";
  setTimeout(()=>e.style.display="none",2600);
}
function saveCart(){
  localStorage.setItem("jvn_market_cart",JSON.stringify(S.cart));
  const c=$("#cartCount"); if(c) c.textContent=S.cart.reduce((a,b)=>a+b.qty,0);
}
function go(page){ S.page=page; render(); window.scrollTo({top:0,behavior:"smooth"}); }
window.go=go;

async function init(){
  saveCart();
  if(sb){
    const {data}=await sb.auth.getSession();
    S.session=data.session;
    if(S.session) await loadProfile();
    sb.auth.onAuthStateChange(async(_,session)=>{
      S.session=session;
      S.profile=null;
      if(session) await loadProfile();
      render();
    });
  }
  await loadProducts();
  render();
  if("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
}
async function loadProfile(){
  if(!sb || !S.session) return;
  const {data,error}=await sb.from("profiles").select("*").eq("id",S.session.user.id).single();
  if(!error) S.profile=data;
}
async function loadProducts(){
  if(!sb){
    S.products=[
      {id:"demo-tm",name:"Tani Madjoe (TM)",price:125000,stock:49,points:500,member_discount:2000},
      {id:"demo-nat",name:"TM Nat E",price:165000,stock:2,points:500,member_discount:2000},
      {id:"demo-hab",name:"Ashika Habbat",price:225000,stock:47.5,points:500,member_discount:2000},
      {id:"demo-gold",name:"Ashika Gold",price:320000,stock:1,points:500,member_discount:2000},
      {id:"demo-ck",name:"CK",price:200000,stock:3,points:500,member_discount:2000}
    ]; return;
  }
  const {data,error}=await sb.from("products").select("*").eq("active",true).order("name");
  if(error){ toast("Produk gagal dimuat: "+error.message); return; }
  S.products=data||[];
}
function userPrice(p){
  if(S.profile?.level==="member") return Math.max(0,Number(p.price)-Number(p.member_discount||2000));
  if(S.profile?.level==="agent" && p.agent_price) return Number(p.agent_price);
  if(S.profile?.level==="distributor" && p.distributor_price) return Number(p.distributor_price);
  return Number(p.price||0);
}
function nav(){
  const n=$("#bottomNav"); if(!n) return;
  n.style.display=S.profile?.role==="admin"?"none":"grid";
  n.querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.page===S.page));
}
function productCard(p){
  return `<article class="product">
    <div class="product-thumb"><img src="./assets/icon-192.png" alt="${esc(p.name)}"></div>
    <h3>${esc(p.name)}</h3>
    <div class="price">${rp(userPrice(p))}</div>
    <div class="meta">${p.points||500} poin untuk upline</div>
    <div class="actions">
      <button class="btn btn-outline" onclick="detail('${p.id}')">Detail</button>
      <button class="btn btn-green" onclick="addCart('${p.id}')">+ Keranjang</button>
    </div>
  </article>`;
}
window.addCart=id=>{
  const p=S.products.find(x=>x.id===id); if(!p) return;
  let x=S.cart.find(x=>x.id===id);
  if(x) x.qty++; else S.cart.push({id,qty:1});
  saveCart(); toast("Produk masuk keranjang");
};
window.detail=id=>{
  const p=S.products.find(x=>x.id===id); if(!p) return;
  $("#app").innerHTML=`<div class="card">
    <button class="btn btn-outline" onclick="go('catalog')">← Kembali</button>
    <div class="product-thumb" style="height:250px;margin:14px 0"><img src="./assets/icon-512.png" style="width:130px;height:130px" alt=""></div>
    <span class="pill gold">${p.points||500} poin / slop</span>
    <h2 style="margin:12px 0 4px">${esc(p.name)}</h2>
    <div class="price" style="font-size:27px">${rp(userPrice(p))}</div>
    <p class="muted">Produk herbal pilihan Javano ID Marketplace.</p>
    <button class="btn btn-green" onclick="addCart('${p.id}')">Tambah ke Keranjang</button>
  </div>`;
};

function home(){
  return `<section class="hero"><div class="hero-content">
    <div class="kicker">JAVANO ID™ MARKETPLACE</div>
    <h1>Marketplace herbal yang terasa premium.</h1>
    <p>Belanja produk, kelola jaringan referral, kumpulkan 500 poin per slop untuk upline, pantau pesanan, dan akses CS dalam satu aplikasi.</p>
    <div class="hero-actions">
      <button class="btn btn-gold" onclick="go('catalog')">Belanja Sekarang</button>
      ${!S.session?`<button class="btn btn-light" onclick="go('account')">Daftar / Masuk</button>`:`<button class="btn btn-light" onclick="go('account')">Lihat Akun</button>`}
    </div>
  </div></section>
  <div class="feature-strip">
    <div class="feature"><b>500 Poin</b><small>Default reward upline per slop.</small></div>
    <div class="feature"><b>Member Hemat</b><small>Diskon Rp2.000 per produk.</small></div>
    <div class="feature"><b>Pengiriman Lengkap</b><small>J&T, JNE, Paxel, Cargo, Pos.</small></div>
    <div class="feature"><b>Virtual Account</b><small>Siap diintegrasikan ke payment gateway.</small></div>
  </div>
  <div class="section-title"><h2>Produk Pilihan</h2><small onclick="go('catalog')" style="cursor:pointer">Lihat semua →</small></div>
  <div class="grid">${S.products.slice(0,4).map(productCard).join("")}</div>`;
}
function catalog(){
  return `<div class="section-title"><h2>Katalog Produk</h2><small>${S.products.length} produk</small></div>
  <div class="grid">${S.products.map(productCard).join("")}</div>`;
}
function cart(){
  if(!S.cart.length) return `<div class="empty"><h2>Keranjang masih kosong</h2><p>Pilih produk Javano ID yang ingin dibeli.</p><button class="btn btn-green" onclick="go('catalog')">Lihat Produk</button></div>`;
  let total=0;
  const rows=S.cart.map(c=>{
    const p=S.products.find(x=>x.id===c.id); if(!p) return "";
    total+=userPrice(p)*c.qty;
    return `<div class="list-item">
      <div class="grow"><b>${esc(p.name)}</b><div class="small muted">${rp(userPrice(p))}/slop</div></div>
      <button class="btn btn-outline" onclick="changeQty('${c.id}',-1)">−</button>
      <b>${c.qty}</b>
      <button class="btn btn-outline" onclick="changeQty('${c.id}',1)">+</button>
      <b class="money">${rp(userPrice(p)*c.qty)}</b>
    </div>`;
  }).join("");
  return `<div class="section-title"><h2>Keranjang</h2></div><div class="card">${rows}
    <div class="list-item"><b>Subtotal</b><b class="money">${rp(total)}</b></div>
    <button class="btn btn-green" style="width:100%;margin-top:12px" onclick="go('checkout')">Lanjut Checkout</button>
  </div>`;
}
window.changeQty=(id,d)=>{
  const x=S.cart.find(x=>x.id===id); if(!x) return;
  x.qty+=d; if(x.qty<=0) S.cart=S.cart.filter(x=>x.id!==id);
  saveCart(); render();
};

function auth(note=""){
  return `<div class="auth-wrap">
    <div class="card"><div class="kicker">JAVANO ID ACCOUNT</div><h2>Masuk</h2>${note?`<p class="muted">${esc(note)}</p>`:""}
      <form class="form-grid" onsubmit="login(event)">
        <div class="field"><label>Email</label><input name="email" type="email" required></div>
        <div class="field"><label>Password</label><input name="password" type="password" required></div>
        <button class="btn btn-green">Masuk</button>
      </form>
    </div>
    <div class="card"><h2>Daftar Akun</h2>
      <div class="auth-tabs">
        <button type="button" class="active" onclick="setRegType('buyer',this)">Pembeli</button>
        <button type="button" onclick="setRegType('member',this)">Member</button>
        <button type="button" onclick="setRegType('agent',this)">Agen</button>
        <button type="button" onclick="setRegType('distributor',this)">Distributor</button>
      </div>
      <form id="regForm" class="form-grid" onsubmit="register(event)">
        <input type="hidden" name="level" value="buyer">
        <div class="field"><label>Nama</label><input name="full_name" required></div>
        <div class="field"><label>No. HP</label><input name="phone" required></div>
        <div class="field"><label>Email</label><input name="email" type="email" required></div>
        <div class="field"><label>Password</label><input name="password" type="password" minlength="6" required></div>
        <div id="networkFields" class="form-grid" style="display:none">
          <div class="field"><label>NIK</label><input name="nik" inputmode="numeric"></div>
          <div class="field"><label>Kode Upline</label><input name="upline_code" placeholder="Contoh: JAVANO-MALANG"></div>
          <div id="levelInfo" class="pill gold"></div>
        </div>
        <button class="btn btn-gold">Daftar</button>
      </form>
    </div>
  </div>`;
}
window.setRegType=(level,btn)=>{
  document.querySelectorAll(".auth-tabs button").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active");
  const f=$("#regForm"); f.level.value=level;
  const network=$("#networkFields");
  const need=level!=="buyer";
  network.style.display=need?"grid":"none";
  f.nik.required=need; f.upline_code.required=need;
  const info={
    member:"Deposit Rp20.000 • diskon Rp2.000/produk",
    agent:"Deposit Rp200.000 • pembelian awal min. 20 slop",
    distributor:"Deposit Rp1.000.000 • pembelian awal min. 100 slop"
  }[level]||"";
  $("#levelInfo").textContent=info;
};
window.login=async e=>{
  e.preventDefault(); if(!sb) return toast("Supabase belum terhubung. Periksa config.js.");
  const f=new FormData(e.target);
  const {error}=await sb.auth.signInWithPassword({email:f.get("email"),password:f.get("password")});
  if(error) toast(error.message); else {toast("Berhasil masuk"); go("home");}
};
window.register=async e=>{
  e.preventDefault(); if(!sb) return toast("Supabase belum terhubung. Periksa config.js.");
  const f=new FormData(e.target), level=f.get("level");
  const meta={full_name:f.get("full_name"),phone:f.get("phone"),level,
    nik:level==="buyer"?null:f.get("nik"),upline_code:level==="buyer"?null:f.get("upline_code")};
  const {error}=await sb.auth.signUp({email:f.get("email"),password:f.get("password"),options:{data:meta}});
  if(error) toast(error.message); else toast("Registrasi berhasil. Silakan cek email bila verifikasi aktif.");
};
window.logout=async()=>{ if(sb) await sb.auth.signOut(); S.page="home"; render(); };

function checkout(){
  if(!S.session) return auth("Silakan masuk terlebih dahulu sebelum checkout.");
  if(!S.cart.length) return `<div class="empty">Keranjang kosong.</div>`;
  const total=S.cart.reduce((a,c)=>{const p=S.products.find(x=>x.id===c.id);return a+(p?userPrice(p)*c.qty:0)},0);
  return `<div class="section-title"><h2>Checkout</h2></div>
  <form class="card form-grid" onsubmit="placeOrder(event)">
    <div class="form-grid two">
      <div class="field"><label>Nama penerima</label><input name="recipient" required value="${esc(S.profile?.full_name||"")}"></div>
      <div class="field"><label>No. HP</label><input name="phone" required value="${esc(S.profile?.phone||"")}"></div>
    </div>
    <div class="field"><label>Alamat lengkap</label><textarea name="address" rows="3" required></textarea></div>
    <div class="form-grid two">
      <div class="field"><label>Kode Pos</label><input name="postal_code" required></div>
      <div class="field"><label>Ekspedisi</label><select name="shipping"><option>J&T Express</option><option>JNE</option><option>Paxel</option><option>JNE Cargo</option><option>Pos Indonesia</option></select></div>
    </div>
    <div class="field"><label>Virtual Account</label><select name="va_bank"><option>BCA VA</option><option>BNI VA</option><option>BRI VA</option><option>Mandiri VA</option><option>Permata VA</option></select><div class="small muted">Nomor VA live aktif setelah payment gateway diintegrasikan.</div></div>
    <div class="list-item"><span>Subtotal</span><b class="money">${rp(total)}</b></div>
    <button class="btn btn-green">Buat Pesanan</button>
  </form>`;
}
window.placeOrder=async e=>{
  e.preventDefault(); if(!sb) return toast("Supabase belum terhubung.");
  const f=new FormData(e.target);
  const items=S.cart.map(c=>{const p=S.products.find(x=>x.id===c.id);return {product_id:p.id,qty:c.qty,unit_price:userPrice(p),points_each:Number(p.points||500)}});
  const {error}=await sb.rpc("create_order",{p_items:items,p_recipient:f.get("recipient"),p_phone:f.get("phone"),p_address:f.get("address"),p_postal_code:f.get("postal_code"),p_shipping:f.get("shipping"),p_va_bank:f.get("va_bank")});
  if(error) return toast(error.message);
  S.cart=[]; saveCart(); toast("Pesanan berhasil dibuat"); go("orders");
};

async function network(){
  if(!S.session) return auth("Masuk untuk melihat jaringan.");
  if(S.profile?.level==="buyer") return `<div class="card"><div class="kicker">UPGRADE</div><h2>Jadi Member Javano ID</h2><p class="muted">Aktifkan kode referral, diskon produk Rp2.000, dan reward jaringan.</p><button class="btn btn-gold" onclick="toast('Aktivasi Member membutuhkan deposit Rp20.000')">Upgrade Member</button></div>`;
  if(!sb) return `<div class="empty">Supabase belum terhubung.</div>`;
  const [{data:codes},{data:down}] = await Promise.all([
    sb.from("referral_codes").select("*").eq("owner_id",S.profile.id).eq("active",true),
    sb.from("profiles").select("id,full_name,level,created_at").eq("referral_parent_id",S.profile.id)
  ]);
  return `<div class="section-title"><h2>Jaringan Saya</h2></div>
  <div class="metric-grid">
    <div class="metric"><b>${esc(codes?.[0]?.code||S.profile.referral_code||"-")}</b><span>Kode referral</span></div>
    <div class="metric"><b>${down?.length||0}</b><span>Downline langsung</span></div>
    <div class="metric"><b>${Number(S.profile.points_available||0).toLocaleString("id-ID")}</b><span>Poin tersedia</span></div>
    <div class="metric"><b>${esc(S.profile.level)}</b><span>Level akun</span></div>
  </div>
  <div class="card"><h3>Downline Langsung</h3>${(down||[]).map(x=>`<div class="list-item"><div><b>${esc(x.full_name)}</b><div class="small muted">${esc(x.level)}</div></div><span class="pill">${new Date(x.created_at).toLocaleDateString("id-ID")}</span></div>`).join("")||`<div class="empty">Belum ada downline.</div>`}</div>`;
}
async function wallet(){
  if(!S.session) return auth();
  const pts=Number(S.profile?.points_available||0), rupiah=pts*C.POINT_TO_RUPIAH;
  return `<div class="section-title"><h2>Poin & Penarikan</h2></div>
  <div class="metric-grid"><div class="metric"><b>${pts.toLocaleString("id-ID")}</b><span>Poin tersedia</span></div><div class="metric"><b>${rp(rupiah)}</b><span>Setara rupiah</span></div></div>
  <div class="card"><h3>Tarik Reward</h3><p class="muted">Minimum penarikan ${rp(C.MIN_WITHDRAW_RUPIAH)}.</p><button class="btn btn-green" ${rupiah<C.MIN_WITHDRAW_RUPIAH?"disabled":""} onclick="withdraw()">Ajukan Penarikan</button></div>`;
}
window.withdraw=async()=>{
  if(!sb) return;
  const dest=prompt("Bank/e-wallet dan nomor tujuan"); if(!dest) return;
  const amount=Number(prompt("Nominal penarikan",String(C.MIN_WITHDRAW_RUPIAH))); if(!amount) return;
  const {error}=await sb.rpc("request_withdrawal",{p_amount_rupiah:amount,p_destination:dest});
  toast(error?error.message:"Pengajuan withdrawal dikirim.");
};

async function orders(){
  if(!S.session) return auth();
  if(!sb) return `<div class="empty">Supabase belum terhubung.</div>`;
  const {data,error}=await sb.from("orders").select("*").eq("buyer_id",S.profile.id).order("created_at",{ascending:false});
  if(error) return `<div class="empty">${esc(error.message)}</div>`;
  return `<div class="section-title"><h2>Pesanan Saya</h2></div>${(data||[]).map(o=>`<div class="card">
    <div class="row"><div class="grow"><b>#${esc(o.order_no)}</b><div class="small muted">${new Date(o.created_at).toLocaleString("id-ID")}</div></div><span class="pill">${esc(o.status)}</span></div>
    <div class="list-item"><span>Total</span><b class="money">${rp(o.total)}</b></div>
    <div class="list-item"><span>Ekspedisi</span><span>${esc(o.shipping_method||"-")}</span></div>
    <div class="list-item"><span>Resi</span><span>${esc(o.tracking_no||"-")}</span></div>
  </div>`).join("")||`<div class="empty">Belum ada pesanan.</div>`}`;
}
function account(){
  if(!S.session) return auth();
  return `<div class="card"><div class="kicker">AKUN ${esc((S.profile?.level||"buyer").toUpperCase())}</div><h2>${esc(S.profile?.full_name||"Javano User")}</h2><p class="muted">${esc(S.session.user.email)}</p></div>
  <div class="card">
    <div class="list-item"><span>No. HP</span><b>${esc(S.profile?.phone||"-")}</b></div>
    <div class="list-item"><span>NIK</span><b>${maskNik(S.profile?.nik)}</b></div>
    <div class="list-item"><span>Kode referral</span><b>${esc(S.profile?.referral_code||"-")}</b></div>
  </div>
  ${S.profile?.level!=="buyer" && S.profile?.role!=="admin"?`<button class="btn btn-outline" style="width:100%;margin-bottom:10px" onclick="go('wallet')">Poin & Penarikan</button>`:""}
  ${S.profile?.role==="admin"?`<button class="btn btn-gold" style="width:100%;margin-bottom:10px" onclick="go('admin')">Dashboard Admin</button>`:""}
  <button class="btn btn-danger" style="width:100%" onclick="logout()">Keluar</button>`;
}
function support(){
  const wa=C.CS_WHATSAPP.replace(/\D/g,"");
  return `<div class="section-title"><h2>CS Admin</h2></div><div class="card"><div class="kicker">CUSTOMER SERVICE</div><h2>Ada yang bisa kami bantu?</h2><p class="muted">Bantuan pesanan, pembayaran VA, pengiriman, referral dan reward.</p><button class="btn btn-green" onclick="window.open('https://wa.me/${wa}?text='+encodeURIComponent('Halo CS Javano ID, saya butuh bantuan.'),'_blank')">Hubungi WhatsApp CS</button></div>`;
}

function adminNav(){
  return `<div class="admin-nav">
    <button class="btn btn-outline" onclick="go('admin')">Dashboard</button>
    <button class="btn btn-outline" onclick="adminSection('members')">Jaringan</button>
    <button class="btn btn-outline" onclick="adminSection('codes')">Kode Upline</button>
    <button class="btn btn-outline" onclick="adminSection('orders')">Pesanan</button>
    <button class="btn btn-outline" onclick="adminSection('products')">Produk</button>
    <button class="btn btn-outline" onclick="adminSection('withdraw')">Withdrawal</button>
  </div>`;
}
async function admin(){
  if(S.profile?.role!=="admin") return `<div class="empty">Akses Admin diperlukan.</div>`;
  return `<div class="section-title"><h2>Dashboard Admin</h2></div>${adminNav()}
  <div class="metric-grid">
    <div class="metric"><b>Jaringan</b><span>Lihat downline dan upline</span></div>
    <div class="metric"><b>Referral</b><span>Buat kode custom</span></div>
    <div class="metric"><b>Order</b><span>Status, VA dan resi</span></div>
    <div class="metric"><b>Reward</b><span>Kelola withdrawal</span></div>
  </div>`;
}
window.adminSection=async sec=>{
  if(!sb || S.profile?.role!=="admin") return;
  let html=`<div class="section-title"><h2>Admin • ${esc(sec)}</h2></div>${adminNav()}`;
  if(sec==="members"){
    const {data,error}=await sb.from("admin_network_view").select("*").order("joined_at",{ascending:false});
    if(error) html+=`<div class="card danger">${esc(error.message)}</div>`;
    else html+=`<div class="card table-wrap"><table class="table"><thead><tr><th>Nama</th><th>Level</th><th>HP</th><th>NIK</th><th>Kode</th><th>Upline</th><th>Level Upline</th></tr></thead><tbody>${(data||[]).map(x=>`<tr><td>${esc(x.member_name)}</td><td>${esc(x.member_level)}</td><td>${esc(x.phone)}</td><td>${maskNik(x.nik)}</td><td>${esc(x.referral_code||"-")}</td><td>${esc(x.upline_name||"-")}</td><td>${esc(x.upline_level||"-")}</td></tr>`).join("")}</tbody></table></div>`;
  } else if(sec==="codes"){
    const {data}=await sb.from("admin_referral_codes_view").select("*").order("created_at",{ascending:false});
    html+=`<div class="card"><h3>Buat Kode Upline Custom</h3><form class="form-grid two" onsubmit="createCode(event)"><div class="field"><label>Email pemilik/upline</label><input type="email" name="email" required></div><div class="field"><label>Kode</label><input name="code" required placeholder="JAVANO-MALANG"></div><button class="btn btn-green">Buat Kode</button></form></div>
    <div class="card table-wrap"><table class="table"><thead><tr><th>Kode</th><th>Pemilik</th><th>Level</th><th>Aktif</th><th>Pemakai</th></tr></thead><tbody>${(data||[]).map(x=>`<tr><td><b>${esc(x.code)}</b></td><td>${esc(x.owner_name)}</td><td>${esc(x.owner_level)}</td><td>${x.active?"Ya":"Tidak"}</td><td>${x.uses_count||0}</td></tr>`).join("")}</tbody></table></div>`;
  } else if(sec==="orders"){
    const {data}=await sb.from("admin_orders_view").select("*").order("created_at",{ascending:false});
    html+=`<div class="card table-wrap"><table class="table"><thead><tr><th>Order</th><th>Pembeli</th><th>Upline</th><th>Total</th><th>Ekspedisi</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${(data||[]).map(x=>`<tr><td>${esc(x.order_no)}</td><td>${esc(x.buyer_name)}</td><td>${esc(x.upline_name||"-")}</td><td>${rp(x.total)}</td><td>${esc(x.shipping_method||"-")}</td><td>${esc(x.status)}</td><td><button class="btn btn-outline" onclick="orderStatus('${x.id}')">Ubah</button></td></tr>`).join("")}</tbody></table></div>`;
  } else if(sec==="products"){
    const {data}=await sb.from("products").select("*").order("name");
    html+=`<div class="card table-wrap"><table class="table"><thead><tr><th>Produk</th><th>Harga</th><th>Stok</th><th>Poin</th><th>Diskon Member</th></tr></thead><tbody>${(data||[]).map(x=>`<tr><td>${esc(x.name)}</td><td>${rp(x.price)}</td><td>${x.stock}</td><td>${x.points}</td><td>${rp(x.member_discount)}</td></tr>`).join("")}</tbody></table></div>`;
  } else if(sec==="withdraw"){
    const {data}=await sb.from("admin_withdrawals_view").select("*").order("created_at",{ascending:false});
    html+=`<div class="card table-wrap"><table class="table"><thead><tr><th>Nama</th><th>Poin</th><th>Nominal</th><th>Tujuan</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${(data||[]).map(x=>`<tr><td>${esc(x.full_name)}</td><td>${x.points}</td><td>${rp(x.amount_rupiah)}</td><td>${esc(x.destination)}</td><td>${esc(x.status)}</td><td>${x.status==="pending"?`<button class="btn btn-green" onclick="approveWithdrawal('${x.id}')">Tandai Dibayar</button>`:"-"}</td></tr>`).join("")}</tbody></table></div>`;
  }
  $("#app").innerHTML=html;
};
window.createCode=async e=>{
  e.preventDefault(); const f=new FormData(e.target);
  const {error}=await sb.rpc("admin_create_referral_code",{p_owner_email:f.get("email"),p_code:f.get("code")});
  toast(error?error.message:"Kode upline berhasil dibuat"); if(!error) adminSection("codes");
};
window.orderStatus=async id=>{
  const status=prompt("Status: pending_payment / paid / processing / shipped / completed / cancelled / refunded");
  if(!status) return;
  const tracking=status==="shipped"?prompt("Nomor resi") : null;
  const {error}=await sb.rpc("admin_update_order_status",{p_order_id:id,p_status:status,p_tracking_no:tracking});
  toast(error?error.message:"Status berhasil diperbarui"); if(!error) adminSection("orders");
};
window.approveWithdrawal=async id=>{
  if(!confirm("Tandai withdrawal ini sudah dibayar?")) return;
  const {error}=await sb.rpc("admin_approve_withdrawal",{p_withdrawal_id:id});
  toast(error?error.message:"Withdrawal selesai"); if(!error) adminSection("withdraw");
};

async function render(){
  nav();
  const root=$("#app"); if(!root) return;
  if(S.profile?.role==="admin" && !["admin","account","support"].includes(S.page)) S.page="admin";
  if(S.page==="home") root.innerHTML=home();
  else if(S.page==="catalog") root.innerHTML=catalog();
  else if(S.page==="cart") root.innerHTML=cart();
  else if(S.page==="checkout") root.innerHTML=checkout();
  else if(S.page==="network") root.innerHTML=await network();
  else if(S.page==="wallet") root.innerHTML=await wallet();
  else if(S.page==="orders") root.innerHTML=await orders();
  else if(S.page==="account") root.innerHTML=account();
  else if(S.page==="support") root.innerHTML=support();
  else if(S.page==="admin") root.innerHTML=await admin();
  else root.innerHTML=home();
  nav(); saveCart();
}
init();
