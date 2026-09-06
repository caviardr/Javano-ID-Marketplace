# Javano ID Marketplace
Project BARU dan terpisah dari aplikasi laporan Javano ID lama.

Fitur v1: Pembeli non-member (Nama/HP/Email), Member/Agen/Distributor (NIK + kode upline), kode referral otomatis, kode upline custom dari Admin, diskon Member Rp2.000, aturan Agen 20 slop + deposit Rp200.000, Distributor 100 slop + deposit Rp1.000.000, 500 poin/slop untuk upline langsung, 1 poin = Rp1, minimum withdrawal Rp100.000, katalog, cart, checkout, order, jaringan, dashboard Admin, CS WhatsApp, pilihan J&T/JNE/Paxel/JNE Cargo/Pos Indonesia, dan pilihan VA.

SETUP:
1. Buat PROJECT BARU di Supabase.
2. Jalankan seluruh `supabase.sql` di SQL Editor.
3. Isi `config.js` dengan Project URL + Publishable Key Supabase dan nomor WhatsApp CS.
4. Buat akun Admin di Authentication, lalu jalankan query Admin di bagian bawah `supabase.sql`.
5. Upload isi folder ini ke repo GitHub `javano-marketplace`.
6. Settings > Pages > Deploy from branch > main > /(root).

PENTING:
- Virtual Account produksi belum bisa aktif tanpa akun/credential payment gateway merchant.
- Tarif ongkir/tracking live membutuhkan API logistik/aggregator.
- Secret key payment gateway tidak boleh dimasukkan ke `config.js` atau APK; simpan di backend/Edge Function.
- Deposit dan aturan upgrade level disiapkan sebagai aturan bisnis; aktivasi otomatis setelah VA perlu webhook gateway.
