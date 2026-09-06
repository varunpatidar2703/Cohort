const products=[
 {id:1,name:"Minimal Timepiece",cat:"Fashion",price:2499,rating:4.8,img:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80",badge:"NEW"},
 {id:2,name:"Wireless Headphones",cat:"Tech",price:3299,rating:4.7,img:"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80",badge:"BESTSELLER"},
 {id:3,name:"Ceramic Desk Lamp",cat:"Home",price:1799,rating:4.6,img:"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=80"},
 {id:4,name:"Everyday Sneakers",cat:"Fashion",price:2899,rating:4.8,img:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80"},
 {id:5,name:"Smart Speaker",cat:"Tech",price:2199,rating:4.5,img:"https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=700&q=80"},
 {id:6,name:"Linen Cushion",cat:"Home",price:899,rating:4.4,img:"https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=700&q=80"},
 {id:7,name:"Daily Face Set",cat:"Beauty",price:1499,rating:4.7,img:"https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=700&q=80"},
 {id:8,name:"Compact Camera",cat:"Tech",price:4599,rating:4.9,img:"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=700&q=80",badge:"HOT"}
];
let filter="All", cart=JSON.parse(localStorage.getItem("novacart-cart")||"[]");
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const money=n=>"₹"+n.toLocaleString("en-IN");
function render(){
 let q=$("#searchInput").value.toLowerCase();
 let list=products.filter(p=>(filter==="All"||p.cat===filter)&&p.name.toLowerCase().includes(q));
 const sort=$("#sortSelect").value;
 if(sort==="low")list.sort((a,b)=>a.price-b.price); if(sort==="high")list.sort((a,b)=>b.price-a.price);
 $("#products").innerHTML=list.map(p=>`<article class="product"><div class="product-img">${p.badge?`<span class="badge">${p.badge}</span>`:""}<img src="${p.img}" alt="${p.name}" loading="lazy"></div><div class="product-body"><span class="product-cat">${p.cat.toUpperCase()}</span><h3>${p.name}</h3><div class="rating">★ ${p.rating}</div><div class="price-row"><span class="price">${money(p.price)}</span><button class="add" data-add="${p.id}" aria-label="Add ${p.name}">+</button></div></div></article>`).join("")||`<p class="muted">No products found. Try another search.</p>`;
}
function save(){localStorage.setItem("novacart-cart",JSON.stringify(cart));updateCart()}
function updateCart(){
 $("#cartCount").textContent=cart.reduce((s,x)=>s+x.qty,0);
 $("#cartItems").innerHTML=cart.length?cart.map(x=>`<div class="cart-item"><img src="${x.img}" alt=""><div><b>${x.name}</b><small>${money(x.price)}</small><div class="qty"><button data-minus="${x.id}">−</button><span>${x.qty}</span><button data-plus="${x.id}">+</button></div></div><strong>${money(x.price*x.qty)}</strong></div>`).join(""):`<div class="muted" style="padding:30px 0;text-align:center">Your bag is waiting for something nice.</div>`;
 $("#cartTotal").textContent=money(cart.reduce((s,x)=>s+x.price*x.qty,0));
}
function add(id){let p=products.find(x=>x.id===id), item=cart.find(x=>x.id===id); item?item.qty++:cart.push({...p,qty:1});save();toast(`${p.name} added to your bag`)}
function toast(t){let el=$("#toast");el.textContent=t;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1800)}
$$(".chip").forEach(b=>b.onclick=()=>{$$(".chip").forEach(x=>x.classList.remove("active"));b.classList.add("active");filter=b.dataset.filter;render()});
$$(".category").forEach(b=>b.onclick=()=>{filter=b.dataset.category;$$(".chip").forEach(x=>x.classList.toggle("active",x.dataset.filter===filter));document.querySelector("#shop").scrollIntoView({behavior:"smooth"});render()});
$("#searchInput").oninput=render;$("#sortSelect").onchange=render;
$("#products").onclick=e=>{let b=e.target.closest("[data-add]");if(b)add(+b.dataset.add)};
$("#cartItems").onclick=e=>{let plus=e.target.closest("[data-plus]"),minus=e.target.closest("[data-minus]");if(plus){cart.find(x=>x.id===+plus.dataset.plus).qty++}if(minus){let x=cart.find(x=>x.id===+minus.dataset.minus);x.qty--;if(x.qty<=0)cart=cart.filter(y=>y.id!==x.id)}save()};
function openCart(){ $("#cartDrawer").classList.add("open");$("#overlay").classList.add("show")}
function closeCart(){ $("#cartDrawer").classList.remove("open");$("#overlay").classList.remove("show")}
$("#cartBtn").onclick=openCart;$("#closeCart").onclick=closeCart;$("#overlay").onclick=closeCart;
$("#themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("novacart-theme",document.body.classList.contains("dark")?"dark":"light")};
if(localStorage.getItem("novacart-theme")==="dark")document.body.classList.add("dark");
$("#searchBtn").onclick=()=>{$("#searchInput").focus();document.querySelector("#shop").scrollIntoView({behavior:"smooth"})};
$("#checkout").onclick=()=>toast(cart.length?"Checkout demo — connect your payment flow here.":"Add an item first.");
render();updateCart();
