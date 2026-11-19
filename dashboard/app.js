// Radar Token: papan gelap berbahasa Indonesia. Membaca window.RADAR (ditulis di samping
// dashboard/ oleh main.ts) lalu menampilkan papan peringkat, filter, dan panel detail tiap
// protokol dengan rincian nilai tersirat dan rencana farm-nya. Tanpa jaringan: semua yang
// tampil ada di data.js. Farm plan di halaman ini adalah turunan yang sama dengan yang
// ditulis main.ts ke board.json: kategori, chain, TVL, dan umur yang menentukan aksi,
// modal, masa tahan, serta tiap biaya dan waktu. Tidak ada nama protokol yang dikhususkan.
(function () {
  'use strict';

  var DATA = window.RADAR;
  if (!DATA) return;
  var app = document.getElementById('board');
  var state = { q: '', category: 'all', chain: 'all', tab: 'pre-token', sort: 'implied', dir: -1, selected: null };

  function fmtUsd(n) {
    if (n === null || n === undefined || !isFinite(n)) return 'n/a';
    if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + ' M';
    if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(1) + ' jt';
    if (Math.abs(n) >= 1e3) return '$' + Math.round(n / 1e3) + ' rb';
    return '$' + Math.round(n);
  }
  function fmtPct(n) {
    if (n === null || n === undefined || !isFinite(n)) return 'n/a';
    return (n > 0 ? '+' : '') + n.toFixed(2) + '%';
  }
  function fmtAge(days) {
    if (days === null || days === undefined) return 'tidak diketahui';
    if (days >= 365) return (days / 365).toFixed(1) + ' thn';
    return Math.max(0, Math.round(days)) + ' hari';
  }
  function fmtMult(n) {
    if (n === null || n === undefined || !isFinite(n)) return 'n/a';
    return 'x' + n.toFixed(2);
  }

  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
      });
    }
    for (var i = 2; i < arguments.length; i++) {
      var child = arguments[i];
      if (child === null || child === undefined) continue;
      if (Array.isArray(child)) child.forEach(function (c) { if (c) node.appendChild(c); });
      else if (typeof child === 'string') node.appendChild(document.createTextNode(child));
      else node.appendChild(child);
    }
    return node;
  }

  // Rencana farm: turunan yang sama dengan lib/model.ts. Jangan ubah satu kata pun tanpa
  // mengubah modelnya juga, supaya rencana di halaman dan di board.json tetap sama.
  function chainOf(p) { return p.chains && p.chains.length > 0 ? p.chains[0] : 'chain utamanya'; }
  function capitalFor(p) {
    if (p.tvl_usd >= 5e9) return 250;
    if (p.tvl_usd >= 1e9) return 150;
    if (p.tvl_usd >= 1e8) return 100;
    return 50;
  }
  function holdDaysFor(age) {
    if (age === null || age === undefined) return 45;
    if (age < 180) return 60;
    if (age < 365) return 45;
    return 30;
  }
  function actionFor(p, capital, chain) {
    var c = (p.category || '').toLowerCase();
    var name = p.name;
    if (c.indexOf('lend') >= 0 || c.indexOf('cdp') >= 0 || c.indexOf('collateral') >= 0) return 'Supply $' + capital + ' of USDC to ' + name + ' on ' + chain + ' as a lender and keep the position open.';
    if (c.indexOf('dex') >= 0 || c.indexOf('yield') >= 0 || c.indexOf('leveraged farm') >= 0 || c.indexOf('liquidity manager') >= 0) return 'Provide $' + capital + ' of liquidity to ' + name + "'s main pool on " + chain + ' and keep the position open.';
    if (c.indexOf('perpetual') >= 0 || c.indexOf('derivative') >= 0 || c.indexOf('basis trading') >= 0 || c.indexOf('options') >= 0) return 'Deposit $' + capital + ' of USDC as margin on ' + name + ' on ' + chain + ' and open one small hedged position.';
    if (c.indexOf('rwa') >= 0) return "Mint $" + capital + " of " + name + "'s yield-bearing real-world asset on " + chain + ' and hold it.';
    if (c.indexOf('risk curator') >= 0 || c.indexOf('onchain capital allocator') >= 0 || c.indexOf('curator') >= 0 || c.indexOf('allocator') >= 0) return 'Deposit $' + capital + ' into a ' + name + ' vault on ' + chain + ' and keep the vault shares.';
    if (c.indexOf('stable') >= 0) return 'Mint or deposit $' + capital + ' of the stable asset through ' + name + ' on ' + chain + ' and hold it.';
    if (c.indexOf('prediction') >= 0) return 'Fund $' + capital + ' on ' + name + ' on ' + chain + ' and place one market position.';
    if (c.indexOf('insurance') >= 0) return 'Buy $' + capital + ' of cover from ' + name + ' on ' + chain + ' and keep the policy active.';
    if (c.indexOf('launchpad') >= 0) return "Commit $" + capital + " to " + name + "'s next launch allocation on " + chain + ' and finish its eligibility task.';
    if (c.indexOf('staking') >= 0 || c.indexOf('restak') >= 0) return "Stake $" + capital + " of the chain's staking asset through " + name + ' on ' + chain + ' and keep the receipt.';
    if (c.indexOf('governance') >= 0) return "Lock $" + capital + " in " + name + "'s governance vault on " + chain + ' and vote once while it is locked.';
    if (c.indexOf('index') >= 0) return 'Buy $' + capital + ' of the ' + name + ' index on ' + chain + ' and hold the index shares.';
    if (c.indexOf('payment') >= 0) return 'Route $' + capital + ' of payments through ' + name + ' on ' + chain + ' and keep the receipt.';
    if (c.indexOf('chain') >= 0) return "Use $" + capital + " of the chain's native asset inside " + name + "'s own app on " + chain + ' and keep the position open.';
    if (c.indexOf('ai agent') >= 0 || c.indexOf('decentralized ai') >= 0) return 'Stake $' + capital + ' to run one agent task on ' + name + ' on ' + chain + ' and keep the task receipt.';
    if (c.indexOf('nft') >= 0) return 'Buy or list one item worth $' + capital + ' through ' + name + ' on ' + chain + ' and keep the receipt.';
    return 'Deposit $' + capital + ' of USDC into ' + name + ' on ' + chain + ' and keep the position open.';
  }
  function stepText(step) {
    var s = step.text + ' Cost: ' + step.cost + '. Time: ' + step.time + '.';
    if (s.length > 600) s = s.slice(0, 596) + '...';
    if (s.length < 20) s = s + " Hold the position and check the protocol's own page.";
    return s;
  }
  function farmSteps(p) {
    var chain = chainOf(p);
    var capital = capitalFor(p);
    var hold = holdDaysFor(p.age_days);
    return [
      { text: 'Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline on paper, never in a screenshot, a chat or a cloud note.', cost: 'under $3 of gas for the first transaction', time: '5 minutes' },
      { text: actionFor(p, capital, chain), cost: '$' + capital + ' of capital and about $' + (capital >= 150 ? 8 : 4) + ' of gas', time: '15 minutes to set up' },
      { text: 'Each week, make one qualifying action on ' + p.name + ' — a deposit, a borrow, a swap or a vote — so the wallet shows repeat activity instead of a single deposit.', cost: 'about $2 of gas a week', time: '10 minutes a week' },
      { text: 'Hold the position for at least ' + hold + ' days so the activity is counted in more than one snapshot, and do not withdraw and re-deposit the same funds to fake it.', cost: 'the $' + capital + ' stays in the position', time: hold + ' days' },
      { text: "Once a week, open the protocol's own points or rewards page and write down any points, rank or multiplier it shows; never connect the wallet from a link in a DM, a search ad or an impersonator account.", cost: 'no fee to check', time: '10 minutes a week' },
      { text: 'Claim only from the link the protocol itself publishes on its own site or verified account, and never pay anyone to claim: a real claim costs only network gas, and a page asking for a fee, a deposit or your seed phrase is a scam.', cost: 'only network gas to claim', time: '10 minutes' },
      { text: 'Write the wallet address, the dates, the amounts and every transaction hash in a farm log, and keep a second wallet ready so you can unwind the position without touching the farming wallet.', cost: 'nothing but the log', time: '5 minutes' }
    ].map(stepText);
  }

  function readHash() {
    var hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    var params = new URLSearchParams(hash);
    if (params.get('q')) state.q = params.get('q');
    if (params.get('p')) state.selected = params.get('p');
    if (params.get('category')) state.category = params.get('category');
    if (params.get('chain')) state.chain = params.get('chain');
    if (params.get('tab')) state.tab = params.get('tab');
  }
  function writeHash() {
    var params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    if (state.category !== 'all') params.set('category', state.category);
    if (state.chain !== 'all') params.set('chain', state.chain);
    if (state.tab !== 'pre-token') params.set('tab', state.tab);
    if (state.selected) params.set('p', state.selected);
    var next = params.toString();
    if (next) window.history.replaceState(null, '', '#' + next);
    else window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  function matchFilters(r) {
    if (state.category !== 'all' && (r.category || 'Lainnya') !== state.category) return false;
    if (state.chain !== 'all' && !(r.chains || []).some(function (c) { return c === state.chain; })) return false;
    var q = state.q.trim().toLowerCase();
    if (!q) return true;
    var hay = [r.name, r.slug, r.category, (r.chains || []).join(' ')].join(' ').toLowerCase();
    return hay.indexOf(q) >= 0;
  }
  function sortedRows(list) {
    var key = state.sort;
    return list.slice().sort(function (a, b) {
      var av, bv;
      if (key === 'name') { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
      else if (key === 'tvl') { av = a.tvl_usd; bv = b.tvl_usd; }
      else if (key === 'growth') { av = a.change_7d === null ? -Infinity : a.change_7d; bv = b.change_7d === null ? -Infinity : b.change_7d; }
      else if (key === 'age') { av = a.age_days === null ? Infinity : a.age_days; bv = b.age_days === null ? Infinity : b.age_days; }
      else if (key === 'rank') { av = a.rank; bv = b.rank; }
      else { av = a.implied_value_usd; bv = b.implied_value_usd; }
      if (av < bv) return -state.dir;
      if (av > bv) return state.dir;
      return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
    });
  }

  function header() {
    return el('header', { class: 'top' },
      el('div', { class: 'brand' }, el('span', { class: 'mark' }), el('span', { class: 'brand-name', text: 'Radar Token' })),
      el('div', { class: 'top-meta' },
        el('span', null, 'Snapshot ', el('b', { text: DATA.as_of })),
        el('span', null, 'Model ', el('b', { text: DATA.model_version })),
        el('span', null, 'Watchlist ', el('b', { text: DATA.watchlist_size + ' protokol' }))
      )
    );
  }

  function lede() {
    return el('section', { class: 'lede' },
      el('div', null,
        el('h1', { text: 'Protokol pra-token, diurutkan berdasarkan nilai tersirat' }),
        el('p', null, 'Watchlist adalah batas bawah: setiap protokol dengan TVL minimal $', el('b', { text: Math.round(DATA.floor_usd / 1e6) + ' jt' }), ' dan ', el('b', { text: 'tidak ada token tercatat' }), '. Radar early menambahkan ', el('b', { text: String(DATA.early_size) + ' protokol pra-token' }), ' di bawah batas itu, dipilih berdasarkan nilai tersirat. Nilai tersirat adalah perkiraan model, bukan janji harga dan bukan prediksi token akan diterbitkan.')
      ),
      el('div', { class: 'facts' },
        el('div', { class: 'fact' }, el('span', { text: 'Watchlist tercakup' }), el('b', { text: DATA.watchlist_size + ' / ' + DATA.watchlist_size })),
        el('div', { class: 'fact' }, el('span', { text: 'Baris pra-token' }), el('b', { text: String(DATA.board_size) })),
        el('div', { class: 'fact' }, el('span', { text: 'Baris early di bawah floor' }), el('b', { text: String(DATA.early_size) })),
        el('div', { class: 'fact' }, el('span', { text: 'Token live dipisahkan' }), el('b', { text: String(DATA.live_size) }))
      )
    );
  }

  function controls() {
    var categories = Array.from(new Set(DATA.rows.map(function (r) { return r.category || 'Lainnya'; }))).sort();
    var chains = Array.from(new Set(DATA.rows.reduce(function (acc, r) { return acc.concat(r.chains || []); }, []))).sort();
    var search = el('input', { type: 'search', id: 'q', placeholder: 'Cari nama atau slug protokol', value: state.q, 'aria-label': 'Cari protokol' });
    search.addEventListener('input', function () { state.q = search.value; writeHash(); render(); });
    var catSelect = el('select', { id: 'category', 'aria-label': 'Filter berdasarkan kategori' },
      el('option', { value: 'all', text: 'Semua kategori' }),
      categories.map(function (c) { return el('option', { value: c, text: c, selected: c === state.category ? 'selected' : null }); })
    );
    catSelect.addEventListener('change', function () { state.category = catSelect.value; writeHash(); render(); });
    var chainSelect = el('select', { id: 'chain', 'aria-label': 'Filter berdasarkan chain' },
      el('option', { value: 'all', text: 'Semua chain' }),
      chains.map(function (c) { return el('option', { value: c, text: c, selected: c === state.chain ? 'selected' : null }); })
    );
    chainSelect.addEventListener('change', function () { state.chain = chainSelect.value; writeHash(); render(); });
    var pre = el('button', { type: 'button', 'aria-pressed': state.tab === 'pre-token' ? 'true' : 'false', text: 'Pra-token', onclick: function () { state.tab = 'pre-token'; state.selected = null; writeHash(); render(); } });
    var live = el('button', { type: 'button', 'aria-pressed': state.tab === 'live' ? 'true' : 'false', text: 'Token live', onclick: function () { state.tab = 'live'; state.selected = null; writeHash(); render(); } });
    var shown = state.tab === 'pre-token' ? DATA.rows.filter(matchFilters).length + ' dari ' + DATA.rows.length + ' baris' : DATA.live.filter(matchFilters).length + ' dari ' + DATA.live.length + ' token live';
    return el('div', { class: 'controls' },
      el('div', { class: 'field' }, el('label', { for: 'q', text: 'Cari' }), search),
      el('div', { class: 'field' }, el('label', { for: 'category', text: 'Kategori' }), catSelect),
      el('div', { class: 'field' }, el('label', { for: 'chain', text: 'Chain' }), chainSelect),
      el('div', { class: 'field' }, el('span', { class: 'lab', text: 'Status token' }), el('div', { class: 'tabs' }, pre, live)),
      el('span', { class: 'count', text: shown })
    );
  }

  function sortHeader(key, label) {
    return el('th', { scope: 'col' },
      el('button', { type: 'button', onclick: function () { if (state.sort === key) state.dir = -state.dir; else { state.sort = key; state.dir = key === 'name' ? 1 : -1; } render(); } },
        label,
        state.sort === key ? el('span', { 'aria-hidden': 'true', text: state.dir < 0 ? ' v' : ' ^' }) : null
      )
    );
  }

  function boardTable() {
    var list = sortedRows(DATA.rows.filter(matchFilters));
    if (list.length === 0) {
      return el('div', { class: 'panel' }, el('div', { class: 'empty' },
        el('h2', { text: 'Tidak ada protokol yang cocok dengan filter itu' }),
        el('p', { text: 'Hapus pencarian atau pilih kategori dan chain lain untuk melihat papan lagi.' }),
        el('button', { class: 'button primary', type: 'button', text: 'Hapus filter', onclick: function () { state.q = ''; state.category = 'all'; state.chain = 'all'; writeHash(); render(); } })
      ));
    }
    var max = 0;
    list.forEach(function (r) { if (r.implied_value_usd > max) max = r.implied_value_usd; });
    if (!max) max = 1;
    var tbody = el('tbody');
    list.forEach(function (r) {
      var growth = r.change_7d === null ? 'n/a' : fmtPct(r.change_7d);
      var growthClass = r.change_7d === null ? '' : r.change_7d >= 0 ? 'pos' : 'neg';
      var tr = el('tr', {
        'data-selected': state.selected === r.slug ? 'true' : 'false',
        tabindex: '0',
        onclick: function () { openDetail(r.slug); },
        onkeydown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(r.slug); } }
      },
        el('td', { class: 'num', text: String(r.rank) }),
        el('td', null, el('div', { class: 'name' },
          el('b', { text: r.name }),
          el('span', { class: 'sub', text: (r.category || 'Lainnya') + ' di ' + (r.chains && r.chains.length ? r.chains.slice(0, 2).join(', ') : 'chain tanpa nama') })
        )),
        el('td', { class: 'num', text: fmtUsd(r.tvl_usd) }),
        el('td', { class: 'num ' + growthClass, text: growth }),
        el('td', { class: 'num', text: fmtAge(r.age_days) }),
        el('td', null, el('div', { class: 'implied' },
          el('div', { class: 'bar', 'aria-hidden': 'true' }, el('i', { style: 'width:' + Math.max(3, Math.round((r.implied_value_usd / max) * 100)) + '%' })),
          el('span', { class: 'num', text: fmtUsd(r.implied_value_usd) })
        )),
        el('td', null, el('span', { class: 'status pre', text: 'belum ada token' }))
      );
      tbody.appendChild(tr);
    });
    return el('div', { class: 'panel' },
      el('div', { class: 'table-wrap' },
        el('table', null,
          el('caption', { class: 'sub', text: 'Protokol pra-token, nilai tersirat tertinggi dulu. Pilih satu baris untuk melihat rincian model dan rencana farm-nya.' }),
          el('thead', null, el('tr', null,
            sortHeader('rank', 'Peringkat'),
            sortHeader('name', 'Protokol'),
            sortHeader('tvl', 'TVL'),
            sortHeader('growth', '7 hari'),
            sortHeader('age', 'Umur'),
            sortHeader('implied', 'Nilai tersirat'),
            el('th', { scope: 'col', text: 'Token' })
          )),
          tbody
        )
      )
    );
  }

  function liveTable() {
    var list = DATA.live.filter(matchFilters);
    if (list.length === 0) {
      return el('div', { class: 'panel' }, el('div', { class: 'empty' },
        el('h2', { text: 'Tidak ada token live yang cocok dengan filter itu' }),
        el('p', { text: 'Hapus pencarian atau pilih kategori dan chain lain.' }),
        el('button', { class: 'button primary', type: 'button', text: 'Hapus filter', onclick: function () { state.q = ''; state.category = 'all'; state.chain = 'all'; writeHash(); render(); } })
      ));
    }
    var tbody = el('tbody');
    list.forEach(function (r) {
      tbody.appendChild(el('tr', null,
        el('td', { class: 'num', text: 'live' }),
        el('td', null, el('div', { class: 'name' }, el('b', { text: r.name }), el('span', { class: 'sub', text: (r.category || 'Lainnya') + ' di ' + (r.chains && r.chains.length ? r.chains.slice(0, 2).join(', ') : 'chain tanpa nama') }))),
        el('td', { class: 'num', text: fmtUsd(r.tvl_usd) }),
        el('td', { class: 'num ' + (r.change_7d !== null && r.change_7d >= 0 ? 'pos' : 'neg'), text: fmtPct(r.change_7d) }),
        el('td', { class: 'num', text: fmtUsd(r.mcap_usd) }),
        el('td', null, el('span', { class: 'status live', text: 'sudah diperdagangkan' }))
      ));
    });
    return el('div', { class: 'panel' },
      el('div', { class: 'table-wrap' },
        el('table', null,
          el('caption', { class: 'sub', text: 'Token live: protokol ini sudah diperdagangkan, jadi kapitalisasi pasarnya adalah angka pasar, bukan model. Mereka dipisahkan dari peringkat pra-token.' }),
          el('thead', null, el('tr', null, el('th', { scope: 'col', text: 'Status' }), el('th', { scope: 'col', text: 'Protokol' }), el('th', { scope: 'col', text: 'TVL' }), el('th', { scope: 'col', text: '7 hari' }), el('th', { scope: 'col', text: 'Kapitalisasi pasar' }), el('th', { scope: 'col', text: 'Token' }))),
          tbody
        )
      )
    );
  }

  function modelPanel() {
    var m = DATA.model;
    return el('section', { class: 'panel model' },
      el('h2', { text: 'Cara nilai tersirat dihitung' }),
      el('p', { class: 'sub', text: 'Setiap baris dinilai oleh satu fungsi dari angka snapshot. Tidak ada nama protokol yang dikhususkan, dan tidak ada baris yang dipilih manual.' }),
      el('div', { class: 'formula' },
        el('b', { text: 'nilai tersirat' }), ' = TVL x kelipatan kategori x (1 + pertumbuhan 7 hari x ', String(m.growth_weight), ') x kematangan x pengali chain'
      ),
      el('p', { class: 'sub', text: 'Kelipatan kategori adalah median kapitalisasi pasar / TVL dari protokol yang sudah punya token di kategori yang sama pada snapshot ini (cadangan ' + m.category_fallback + ' bila kategorinya tidak punya, dibatasi ' + m.category_min + ' sampai ' + m.category_max + '). Pertumbuhan 7 hari dibatasi ' + m.growth_floor + '% sampai +' + m.growth_cap + '%. Kematangan naik dari ' + m.maturity_floor + ' sampai 1,0 selama ' + m.maturity_days + ' hari, dan umur yang tidak diketahui memakai ' + m.unknown_age_days + ' hari. Pengali chain adalah 1 + 0,03 per chain tambahan, maksimal ' + m.chain_cap + '. Baris early adalah protokol pra-token di bawah floor watchlist, dipilih berdasarkan nilai tersirat, dan protokol token live dipisahkan dengan kapitalisasi pasarnya.' })
    );
  }

  var dialog = el('dialog', { class: 'detail', id: 'detail', 'aria-labelledby': 'detail-title' });
  dialog.addEventListener('close', function () { state.selected = null; writeHash(); });

  function openDetail(slug) {
    var row = null;
    DATA.rows.forEach(function (r) { if (r.slug === slug) row = r; });
    if (!row) return;
    state.selected = slug;
    writeHash();
    dialog.textContent = '';
    var steps = farmSteps(row);
    var recomputed = Math.round(row.base_usd * row.growth_multiplier * row.maturity_multiplier * row.chain_multiplier);
    var check = Math.abs(recomputed - row.implied_value_usd) <= Math.max(2, row.implied_value_usd * 0.001)
      ? 'Halaman ini menghitung ulang baris ini menjadi ' + fmtUsd(recomputed) + ', sama dengan angka yang dibawa board.json (selisih pembulatan saja).'
      : 'Halaman ini menghitung ulang baris ini menjadi ' + fmtUsd(recomputed) + ', berbeda dari angka board.json: datanya akan dianggap basi.';
    dialog.appendChild(el('div', { class: 'detail-head' },
      el('div', null,
        el('span', { class: 'brand-name', text: 'Peringkat ' + row.rank + ' dari ' + DATA.board_size }),
        el('h2', { id: 'detail-title', text: row.name }),
        el('p', { class: 'sub', text: (row.category || 'Lainnya') + ' di ' + (row.chains && row.chains.length ? row.chains.join(', ') : 'chain tanpa nama') })
      ),
      el('button', { class: 'close', type: 'button', 'aria-label': 'Tutup detail', text: 'Tutup', onclick: function () { dialog.close(); } })
    ));
    dialog.appendChild(el('section', { class: 'detail-section' },
      el('h3', { text: 'Rincian nilai tersirat' }),
      el('div', { class: 'equation' },
        el('div', null, el('span', { text: 'TVL' }), el('b', { class: 'num', text: fmtUsd(row.tvl_usd) })),
        el('div', null, el('span', { text: 'Kelipatan kategori (' + (row.category || 'Lainnya') + ')' }), el('b', { class: 'num', text: fmtMult(row.category_multiple) })),
        el('div', { class: 'total' }, el('span', { text: 'Nilai dasar = TVL x kelipatan kategori' }), el('b', { class: 'num', text: fmtUsd(row.base_usd) })),
        el('div', null, el('span', { text: 'Pertumbuhan 7 hari' }), el('b', { class: 'num', text: fmtPct(row.change_7d) + ' -> ' + fmtMult(row.growth_multiplier) })),
        el('div', null, el('span', { text: 'Umur tanpa token' }), el('b', { class: 'num', text: fmtAge(row.age_days) + ' -> ' + fmtMult(row.maturity_multiplier) })),
        el('div', null, el('span', { text: 'Chain (' + (row.chains ? row.chains.length : 0) + ')' }), el('b', { class: 'num', text: fmtMult(row.chain_multiplier) })),
        el('div', { class: 'total' }, el('span', { text: 'Nilai tersirat = dasar x pertumbuhan x kematangan x chain' }), el('b', { class: 'num', text: fmtUsd(row.implied_value_usd) }))
      ),
      el('p', { class: 'sub', text: 'Model ' + DATA.model_version + ': fungsi yang sama menilai setiap protokol. ' + check + ' Ini perkiraan, bukan harga.' })
    ));
    dialog.appendChild(el('section', { class: 'detail-section' },
      el('h3', { text: 'Rencana farm — 7 langkah' }),
      el('ol', { class: 'steps' }, steps.map(function (s) {
        var at = s.indexOf(' Cost: ');
        var action = at >= 0 ? s.slice(0, at) : s;
        var tail = at >= 0 ? s.slice(at + 1) : '';
        return el('li', null, el('b', { text: action }), el('span', { class: 'cost', text: tail }));
      })),
      el('div', { class: 'risk', text: 'Catatan risiko: snapshot hanya mencatat tidak ada token (no token on record) — itu bukan bukti protokol tidak punya token. Nilai tersirat tidak memprediksi apakah atau kapan token diterbitkan. Jangan pernah mengirim seed phrase ke siapa pun, dan klaim hanya dari tautan yang diterbitkan protokol itu sendiri.' })
    ));
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  }

  function render() {
    app.textContent = '';
    var shell = el('div', { class: 'shell' });
    shell.appendChild(header());
    shell.appendChild(lede());
    shell.appendChild(controls());
    shell.appendChild(state.tab === 'pre-token' ? boardTable() : liveTable());
    if (state.tab === 'pre-token') shell.appendChild(modelPanel());
    app.appendChild(shell);
    app.setAttribute('aria-busy', 'false');
    if (!dialog.isConnected) app.appendChild(dialog);
    if (state.selected) openDetail(state.selected);
  }

  readHash();
  render();
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && dialog.open) dialog.close();
  });
})();
