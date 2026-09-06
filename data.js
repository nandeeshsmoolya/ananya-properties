function getProperties(){ return []; }
function saveProperties(list){ localStorage.setItem("ananyaProperties",JSON.stringify(list)); }
function formatRent(n){ return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(n)) + " / month"; }
