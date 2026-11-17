/* 35 Tekstil — site betiği
   1) Çerez izni (KVKK) + Google Consent Mode v2
   2) Google Etiket Yöneticisi (GTM-TL763FGK) yüklemesi
   3) Ölçüm: ürün görüntüleme, sayfada kalma süresi, kaydırma, tıklamalar, teklif formu
   4) Mobil menü
   Kişisel veri (ad, telefon, e-posta) Google'a GÖNDERİLMEZ. */

(function () {
  'use strict';

  var GTM_KIMLIGI = 'GTM-TL763FGK';
  var IZIN_ANAHTARI = 'cerez_izni_35';

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  function olay(ad, parametreler) {
    var veri = { event: ad };
    for (var k in parametreler) if (Object.prototype.hasOwnProperty.call(parametreler, k)) veri[k] = parametreler[k];
    window.dataLayer.push(veri);
  }

  // ---------- 1) Çerez izni ----------
  function izinOku() { try { return localStorage.getItem(IZIN_ANAHTARI); } catch (e) { return null; } }
  function izinYaz(d) { try { localStorage.setItem(IZIN_ANAHTARI, d); } catch (e) { /* özel pencere */ } }
  var izinDurumu = function (evet) {
    var d = evet ? 'granted' : 'denied';
    return { analytics_storage: d, ad_storage: d, ad_user_data: d, ad_personalization: d };
  };

  var kayitliIzin = izinOku();
  var varsayilan = izinDurumu(false);
  varsayilan.wait_for_update = 500;
  gtag('consent', 'default', varsayilan);
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', true);
  if (kayitliIzin === 'evet') gtag('consent', 'update', izinDurumu(true));

  // ---------- Sayfa türü ----------
  var yol = location.pathname.replace(/index\.html$/, '').replace(/\.html$/, '');
  if (yol.length > 1) yol = yol.replace(/\/$/, '');
  var parcalar = yol.split('/').filter(Boolean);
  var sayfaTuru = 'bilgi';
  if (yol === '/' || yol === '') sayfaTuru = 'anasayfa';
  else if (parcalar[0] === 'okullar') sayfaTuru = ['okul_listesi', 'il_okullari', 'okul_urunleri', 'urun_detay'][Math.min(parcalar.length - 1, 3)];
  else if (/^(okul-kiyafetleri|personel-kiyafetleri|kisiye-ozel-urunler)$/.test(parcalar[0])) sayfaTuru = 'kategori';
  else if (parcalar[0] === 'teklif-al') sayfaTuru = 'teklif_formu';
  else if (parcalar[0] === 'tesekkurler') sayfaTuru = 'tesekkur';
  else if (parcalar[0] === 'iletisim') sayfaTuru = 'iletisim';

  window.dataLayer.push({ sayfa_turu: sayfaTuru });

  // ---------- 2) GTM ----------
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  var gtmBetik = document.createElement('script');
  gtmBetik.async = true;
  gtmBetik.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_KIMLIGI;
  (document.head || document.documentElement).appendChild(gtmBetik);

  // ---------- 3) Ölçüm ----------
  function metin(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  var urun = null;

  function urunBilgisi() {
    var h1 = document.querySelector('.product-detail h1, h1');
    var okul = metin(document.querySelector('.product-detail .eyebrow'));
    return {
      item_id: parcalar.slice(1).join('/'),
      item_name: metin(h1),
      item_brand: '35 Tekstil',
      item_category: 'Okul Kıyafetleri',
      item_category2: okul,
      item_category3: parcalar[1] || ''
    };
  }

  function listeGonder() {
    var kartlar = [];
    var listeAdi = metin(document.querySelector('h1')) || document.title;
    if (sayfaTuru === 'okul_urunleri') {
      document.querySelectorAll('a.product-card').forEach(function (a, i) {
        kartlar.push({ item_id: a.getAttribute('href').replace(/^\/okullar\/|\/$/g, ''), item_name: metin(a.querySelector('h4, h3')), item_brand: '35 Tekstil', item_category: 'Okul Kıyafetleri', item_list_name: listeAdi, index: i });
      });
    } else if (sayfaTuru === 'kategori') {
      document.querySelectorAll('[class*="card"] h3, [class*="card"] h4').forEach(function (h, i) {
        kartlar.push({ item_id: parcalar[0] + '/' + (i + 1), item_name: metin(h), item_brand: '35 Tekstil', item_category: metin(document.querySelector('h1')) || parcalar[0], item_list_name: listeAdi, index: i });
      });
    }
    if (!kartlar.length) return;
    window.dataLayer.push({ ecommerce: null });
    olay('view_item_list', { ecommerce: { item_list_name: listeAdi, items: kartlar.slice(0, 50) } });
  }

  // Sayfada geçirilen GÖRÜNÜR süre (sekme arka plandayken saymaz).
  var gorunurBaslangic = document.hidden ? null : Date.now();
  var birikenMs = 0;
  function gecenSaniye() { return Math.round((birikenMs + (gorunurBaslangic ? Date.now() - gorunurBaslangic : 0)) / 1000); }
  function sureAraligi(sn) { return sn < 10 ? '0-10 sn' : sn < 30 ? '10-30 sn' : sn < 60 ? '30-60 sn' : sn < 120 ? '1-2 dk' : sn < 300 ? '2-5 dk' : '5 dk+'; }
  function ortakParametre() {
    var p = { sayfa_turu: sayfaTuru };
    if (urun) { p.urun_adi = urun.item_name; p.okul = urun.item_category2; }
    return p;
  }

  var esikler = [10, 30, 60, 120, 300];
  var gecilen = {};
  setInterval(function () {
    var sn = gecenSaniye();
    esikler.forEach(function (e) {
      if (sn >= e && !gecilen[e]) {
        gecilen[e] = true;
        var p = ortakParametre(); p.sure_sn = e; p.sure_araligi = sureAraligi(e);
        olay('sayfada_kalma', p);
      }
    });
  }, 1000);

  var ayrilmaGonderildi = false;
  function ayrilmaGonder() {
    if (ayrilmaGonderildi) return;
    ayrilmaGonderildi = true;
    var sn = gecenSaniye();
    var p = ortakParametre(); p.sure_sn = sn; p.sure_araligi = sureAraligi(sn); p.kaydirma_yuzde = enDerinKaydirma;
    olay('sayfadan_ayrilma', p);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (gorunurBaslangic) { birikenMs += Date.now() - gorunurBaslangic; gorunurBaslangic = null; }
      ayrilmaGonder();
    } else {
      gorunurBaslangic = Date.now();
      ayrilmaGonderildi = false; // sekmeye geri döndü; çıkarken tekrar gönderilir
    }
  });
  window.addEventListener('pagehide', ayrilmaGonder);

  // Kaydırma derinliği: %25, %50, %75, %100
  var enDerinKaydirma = 0;
  var kaydirmaEsikleri = [25, 50, 75, 100];
  function kaydirmaKontrol() {
    var h = document.documentElement;
    var toplam = h.scrollHeight - window.innerHeight;
    var yuzde = toplam <= 0 ? 100 : Math.min(100, Math.round((window.scrollY / toplam) * 100));
    kaydirmaEsikleri.forEach(function (e) {
      if (yuzde >= e && enDerinKaydirma < e) {
        enDerinKaydirma = e;
        var p = ortakParametre(); p.kaydirma_yuzde = e;
        olay('kaydirma_derinligi', p);
      }
    });
  }

  function tiklamaTuru(a) {
    var h = (a.getAttribute('href') || '').toLowerCase();
    if (h.indexOf('tel:') === 0) return 'telefon_tikla';
    if (h.indexOf('wa.me') > -1 || h.indexOf('whatsapp') > -1) return 'whatsapp_tikla';
    if (h.indexOf('mailto:') === 0) return 'eposta_tikla';
    if (h.indexOf('instagram.com') > -1) return 'instagram_tikla';
    if (/\/teklif-al(\.html)?\/?$/.test(h.split('?')[0])) return 'teklif_butonu_tikla';
    return null;
  }

  function dinleyicileriBagla() {
    if (sayfaTuru === 'urun_detay') {
      urun = urunBilgisi();
      window.dataLayer.push({ ecommerce: null });
      olay('view_item', { urun_adi: urun.item_name, okul: urun.item_category2, ecommerce: { currency: 'TRY', items: [urun] } });
    }
    listeGonder();

    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var tur = tiklamaTuru(a);
      var p = ortakParametre();
      p.hedef = (a.getAttribute('href') || '').split('?')[0].replace(/^tel:.*/, 'tel').replace(/^mailto:.*/, 'mailto');
      p.dugme_metni = metin(a).slice(0, 60);
      p.konum = a.closest('header, nav') ? 'ust_menu' : a.closest('footer') ? 'alt_bilgi' : 'icerik';
      if (tur) {
        olay(tur, p);
        if (tur === 'teklif_butonu_tikla' && urun) {
          window.dataLayer.push({ ecommerce: null });
          olay('add_to_cart', { urun_adi: urun.item_name, okul: urun.item_category2, ecommerce: { currency: 'TRY', items: [urun] } });
        }
      }
      if (a.classList.contains('product-card')) {
        window.dataLayer.push({ ecommerce: null });
        olay('select_item', { ecommerce: { item_list_name: metin(document.querySelector('h1')), items: [{ item_id: a.getAttribute('href').replace(/^\/okullar\/|\/$/g, ''), item_name: metin(a.querySelector('h4, h3')), item_brand: '35 Tekstil' }] } });
      }
    }, true);

    var form = document.querySelector('form[name="teklif-formu"], form#teklif-formu');
    if (form) {
      var basladi = false;
      form.addEventListener('focusin', function () {
        if (basladi) return;
        basladi = true;
        olay('teklif_formu_basla', { sayfa_turu: sayfaTuru, form_adi: 'teklif-formu' });
      });
      form.addEventListener('submit', function () {
        var tur = form.querySelector('[name="tur"]');
        try { sessionStorage.setItem('teklif_tur', tur ? tur.value : ''); } catch (err) { /* yok say */ }
        olay('teklif_formu_gonder', { sayfa_turu: sayfaTuru, form_adi: 'teklif-formu', talep_turu: tur ? tur.value : '' });
      });
    }

    if (sayfaTuru === 'tesekkur') {
      var talep = '';
      try { talep = sessionStorage.getItem('teklif_tur') || ''; sessionStorage.removeItem('teklif_tur'); } catch (err) { /* yok say */ }
      if (talep || document.referrer.indexOf('/teklif-al') > -1) {
        olay('generate_lead', { form_adi: 'teklif-formu', talep_turu: talep, currency: 'TRY', value: 0 });
      }
    }

    window.addEventListener('scroll', kaydirmaKontrol, { passive: true });
    kaydirmaKontrol();
    izinBandi();
  }

  // ---------- Çerez bandı ----------
  function izinBandi() {
    if (izinOku()) return;
    var bant = document.createElement('div');
    bant.id = 'cerez-bandi';
    bant.setAttribute('role', 'dialog');
    bant.setAttribute('aria-label', 'Çerez tercihi');
    bant.innerHTML =
      '<p>Sitemizi geliştirmek ve reklamlarımızın etkisini ölçmek için çerezler kullanıyoruz. Onay vermezseniz yalnızca zorunlu çerezler kullanılır.</p>' +
      '<div class="cerez-dugmeler"><button type="button" class="cerez-red">Reddet</button><button type="button" class="cerez-kabul">Kabul Et</button></div>';
    var stil = document.createElement('style');
    stil.textContent =
      '#cerez-bandi{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:720px;margin:0 auto;background:#16233F;color:#fff;border-radius:10px;padding:16px 18px;box-shadow:0 8px 30px rgba(0,0,0,.25);display:flex;gap:16px;align-items:center;flex-wrap:wrap;font-size:14px;line-height:1.5}' +
      '#cerez-bandi p{margin:0;flex:1 1 320px}' +
      '#cerez-bandi .cerez-dugmeler{display:flex;gap:8px;flex:0 0 auto}' +
      '#cerez-bandi button{font:inherit;font-weight:600;border-radius:6px;padding:9px 16px;cursor:pointer;border:1px solid rgba(255,255,255,.5);background:transparent;color:#fff}' +
      '#cerez-bandi .cerez-kabul{background:#C9974B;border-color:#C9974B;color:#16233F}';
    document.head.appendChild(stil);
    document.body.appendChild(bant);
    function karar(evet) {
      izinYaz(evet ? 'evet' : 'hayir');
      gtag('consent', 'update', izinDurumu(evet));
      olay('cerez_tercihi', { izin: evet ? 'kabul' : 'red' });
      bant.remove();
    }
    bant.querySelector('.cerez-kabul').addEventListener('click', function () { karar(true); });
    bant.querySelector('.cerez-red').addEventListener('click', function () { karar(false); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', dinleyicileriBagla);
  else dinleyicileriBagla();
})();

// ---------- 4) Mobil menü ----------
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('siteNav');

  if (!toggle || !nav) return;

  toggle.addEventListener('click', function () {
    var isOpen = nav.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      nav.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target) && !toggle.contains(e.target)) {
      nav.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
});
