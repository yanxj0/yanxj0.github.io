var O=Object.prototype.hasOwnProperty;function H(n){var e=1/0,o=1/0,a=-1/0,i=-1/0;function s(r){r!=null&&O.call(c,r.type)&&c[r.type](r)}var c={GeometryCollection:function(r){r.geometries.forEach(s)},Point:function(r){l(r.coordinates)},MultiPoint:function(r){r.coordinates.forEach(l)},LineString:function(r){h(r.arcs)},MultiLineString:function(r){r.arcs.forEach(h)},Polygon:function(r){r.arcs.forEach(h)},MultiPolygon:function(r){r.arcs.forEach(g)}};function l(r){var t=r[0],d=r[1];t<e&&(e=t),t>a&&(a=t),d<o&&(o=d),d>i&&(i=d)}function h(r){r.forEach(l)}function g(r){r.forEach(h)}for(var v in n)s(n[v]);return a>=e&&i>=o?[e,o,a,i]:void 0}function J(n,e,o,a,i){arguments.length===3&&(a=Array,i=null);for(var s=new a(n=1<<Math.max(4,Math.ceil(Math.log(n)/Math.LN2))),c=n-1,l=0;l<n;++l)s[l]=i;function h(r){for(var t=e(r)&c,d=s[t],y=0;d!=i;){if(o(d,r))return!0;if(++y>=n)throw new Error("full hashset");d=s[t=t+1&c]}return s[t]=r,!0}function g(r){for(var t=e(r)&c,d=s[t],y=0;d!=i;){if(o(d,r))return!0;if(++y>=n)break;d=s[t=t+1&c]}return!1}function v(){for(var r=[],t=0,d=s.length;t<d;++t){var y=s[t];y!=i&&r.push(y)}return r}return{add:h,has:g,values:v}}function K(n,e,o,a,i,s){arguments.length===3&&(a=s=Array,i=null);for(var c=new a(n=1<<Math.max(4,Math.ceil(Math.log(n)/Math.LN2))),l=new s(n),h=n-1,g=0;g<n;++g)c[g]=i;function v(y,A){for(var p=e(y)&h,u=c[p],f=0;u!=i;){if(o(u,y))return l[p]=A;if(++f>=n)throw new Error("full hashmap");u=c[p=p+1&h]}return c[p]=y,l[p]=A,A}function r(y,A){for(var p=e(y)&h,u=c[p],f=0;u!=i;){if(o(u,y))return l[p];if(++f>=n)throw new Error("full hashmap");u=c[p=p+1&h]}return c[p]=y,l[p]=A,A}function t(y,A){for(var p=e(y)&h,u=c[p],f=0;u!=i;){if(o(u,y))return l[p];if(++f>=n)break;u=c[p=p+1&h]}return A}function d(){for(var y=[],A=0,p=c.length;A<p;++A){var u=c[A];u!=i&&y.push(u)}return y}return{set:v,maybeSet:r,get:t,keys:d}}function I(n,e){return n[0]===e[0]&&n[1]===e[1]}var U=new ArrayBuffer(16),S=new Float64Array(U),R=new Uint32Array(U);function T(n){S[0]=n[0],S[1]=n[1];var e=R[0]^R[1];return e=e<<5^e>>7^R[2]^R[3],e&2147483647}function Q(n){var e=n.coordinates,o=n.lines,a=n.rings,i=w(),s=new Int32Array(e.length),c=new Int32Array(e.length),l=new Int32Array(e.length),h=new Int8Array(e.length),g=0,v,r,t,d,y;for(v=0,r=e.length;v<r;++v)s[v]=c[v]=l[v]=-1;for(v=0,r=o.length;v<r;++v){var A=o[v],p=A[0],u=A[1];for(d=i[p],y=i[++p],++g,h[d]=1;++p<=u;)m(v,t=d,d=y,y=i[p]);++g,h[y]=1}for(v=0,r=e.length;v<r;++v)s[v]=-1;for(v=0,r=a.length;v<r;++v){var f=a[v],P=f[0]+1,x=f[1];for(t=i[x-1],d=i[P-1],y=i[P],m(v,t,d,y);++P<=x;)m(v,t=d,d=y,y=i[P])}function m(L,C,j,E){if(s[j]!==L){s[j]=L;var F=c[j];if(F>=0){var B=l[j];(F!==C||B!==E)&&(F!==E||B!==C)&&(++g,h[j]=1)}else c[j]=C,l[j]=E}}function w(){for(var L=K(e.length*1.4,b,M,Int32Array,-1,Int32Array),C=new Int32Array(e.length),j=0,E=e.length;j<E;++j)C[j]=L.maybeSet(j,j);return C}function b(L){return T(e[L])}function M(L,C){return I(e[L],e[C])}s=c=l=null;var G=J(g*1.4,T,I),q;for(v=0,r=e.length;v<r;++v)h[q=i[v]]&&G.add(e[q]);return G}function V(n){var e=Q(n),o=n.coordinates,a=n.lines,i=n.rings,s,c,l;for(c=0,l=a.length;c<l;++c)for(var h=a[c],g=h[0],v=h[1];++g<v;)e.has(o[g])&&(s={0:g,1:h[1]},h[1]=g,h=h.next=s);for(c=0,l=i.length;c<l;++c)for(var r=i[c],t=r[0],d=t,y=r[1],A=e.has(o[t]);++d<y;)e.has(o[d])&&(A?(s={0:d,1:r[1]},r[1]=d,r=r.next=s):(W(o,t,y,y-d),o[y]=o[t],A=!0,d=t));return n}function W(n,e,o,a){k(n,e,o),k(n,e,e+a),k(n,e+a,o)}function k(n,e,o){for(var a=e+(o---e>>1),i;e<a;++e,--o)i=n[e],n[e]=n[o],n[o]=i}function X(n){var e=n.coordinates,o=n.lines,a,i=n.rings,s,c=o.length+i.length,l,h;for(delete n.lines,delete n.rings,l=0,h=o.length;l<h;++l)for(a=o[l];a=a.next;)++c;for(l=0,h=i.length;l<h;++l)for(s=i[l];s=s.next;)++c;var g=K(c*2*1.4,T,I),v=n.arcs=[];for(l=0,h=o.length;l<h;++l){a=o[l];do r(a);while(a=a.next)}for(l=0,h=i.length;l<h;++l)if(s=i[l],s.next)do r(s);while(s=s.next);else t(s);function r(f){var P,x,m,w,b,M,G,q;if(m=g.get(P=e[f[0]])){for(G=0,q=m.length;G<q;++G)if(w=m[G],d(w,f)){f[0]=w[0],f[1]=w[1];return}}if(b=g.get(x=e[f[1]])){for(G=0,q=b.length;G<q;++G)if(M=b[G],y(M,f)){f[1]=M[0],f[0]=M[1];return}}m?m.push(f):g.set(P,[f]),b?b.push(f):g.set(x,[f]),v.push(f)}function t(f){var P,x,m,w,b;if(x=g.get(P=e[f[0]]))for(w=0,b=x.length;w<b;++w){if(m=x[w],A(m,f)){f[0]=m[0],f[1]=m[1];return}if(p(m,f)){f[0]=m[1],f[1]=m[0];return}}if(x=g.get(P=e[f[0]+u(f)]))for(w=0,b=x.length;w<b;++w){if(m=x[w],A(m,f)){f[0]=m[0],f[1]=m[1];return}if(p(m,f)){f[0]=m[1],f[1]=m[0];return}}x?x.push(f):g.set(P,[f]),v.push(f)}function d(f,P){var x=f[0],m=P[0],w=f[1],b=P[1];if(x-w!==m-b)return!1;for(;x<=w;++x,++m)if(!I(e[x],e[m]))return!1;return!0}function y(f,P){var x=f[0],m=P[0],w=f[1],b=P[1];if(x-w!==m-b)return!1;for(;x<=w;++x,--b)if(!I(e[x],e[b]))return!1;return!0}function A(f,P){var x=f[0],m=P[0],w=f[1],b=P[1],M=w-x;if(M!==b-m)return!1;for(var G=u(f),q=u(P),L=0;L<M;++L)if(!I(e[x+(L+G)%M],e[m+(L+q)%M]))return!1;return!0}function p(f,P){var x=f[0],m=P[0],w=f[1],b=P[1],M=w-x;if(M!==b-m)return!1;for(var G=u(f),q=M-u(P),L=0;L<M;++L)if(!I(e[x+(L+G)%M],e[b-(L+q)%M]))return!1;return!0}function u(f){for(var P=f[0],x=f[1],m=P,w=m,b=e[m];++m<x;){var M=e[m];(M[0]<b[0]||M[0]===b[0]&&M[1]<b[1])&&(w=m,b=M)}return w-P}return n}function Y(n){for(var e=-1,o=n.length;++e<o;){for(var a=n[e],i=0,s=1,c=a.length,l=a[0],h=l[0],g=l[1],v,r;++i<c;)l=a[i],v=l[0],r=l[1],(v!==h||r!==g)&&(a[s++]=[v-h,r-g],h=v,g=r);s===1&&(a[s++]=[0,0]),a.length=s}return n}function Z(n){var e=-1,o=[],a=[],i=[];function s(r){r&&O.call(c,r.type)&&c[r.type](r)}var c={GeometryCollection:function(r){r.geometries.forEach(s)},LineString:function(r){r.arcs=l(r.arcs)},MultiLineString:function(r){r.arcs=r.arcs.map(l)},Polygon:function(r){r.arcs=r.arcs.map(h)},MultiPolygon:function(r){r.arcs=r.arcs.map(g)}};function l(r){for(var t=0,d=r.length;t<d;++t)i[++e]=r[t];var y={0:e-d+1,1:e};return o.push(y),y}function h(r){for(var t=0,d=r.length;t<d;++t)i[++e]=r[t];var y={0:e-d+1,1:e};return a.push(y),y}function g(r){return r.map(h)}for(var v in n)s(n[v]);return{type:"Topology",coordinates:i,lines:o,rings:a,objects:n}}function _(n){var e={},o;for(o in n)e[o]=$(n[o]);return e}function $(n){return n==null?{type:null}:(n.type==="FeatureCollection"?z:n.type==="Feature"?D:N)(n)}function z(n){var e={type:"GeometryCollection",geometries:n.features.map(D)};return n.bbox!=null&&(e.bbox=n.bbox),e}function D(n){var e=N(n.geometry),o;n.id!=null&&(e.id=n.id),n.bbox!=null&&(e.bbox=n.bbox);for(o in n.properties){e.properties=n.properties;break}return e}function N(n){if(n==null)return{type:null};var e=n.type==="GeometryCollection"?{type:"GeometryCollection",geometries:n.geometries.map(N)}:n.type==="Point"||n.type==="MultiPoint"?{type:n.type,coordinates:n.coordinates}:{type:n.type,arcs:n.coordinates};return n.bbox!=null&&(e.bbox=n.bbox),e}function nn(n,e,o){var a=e[0],i=e[1],s=e[2],c=e[3],l=s-a?(o-1)/(s-a):1,h=c-i?(o-1)/(c-i):1;function g(u){return[Math.round((u[0]-a)*l),Math.round((u[1]-i)*h)]}function v(u,f){for(var P=-1,x=0,m=u.length,w=new Array(m),b,M,G,q,L;++P<m;)b=u[P],q=Math.round((b[0]-a)*l),L=Math.round((b[1]-i)*h),(q!==M||L!==G)&&(w[x++]=[M=q,G=L]);for(w.length=x;x<f;)x=w.push([w[0][0],w[0][1]]);return w}function r(u){return v(u,2)}function t(u){return v(u,4)}function d(u){return u.map(t)}function y(u){u!=null&&O.call(A,u.type)&&A[u.type](u)}var A={GeometryCollection:function(u){u.geometries.forEach(y)},Point:function(u){u.coordinates=g(u.coordinates)},MultiPoint:function(u){u.coordinates=u.coordinates.map(g)},LineString:function(u){u.arcs=r(u.arcs)},MultiLineString:function(u){u.arcs=u.arcs.map(r)},Polygon:function(u){u.arcs=d(u.arcs)},MultiPolygon:function(u){u.arcs=u.arcs.map(d)}};for(var p in n)y(n[p]);return{scale:[1/l,1/h],translate:[a,i]}}function tn(n,e){var o=H(n=_(n)),a=e>0&&o&&nn(n,o,e),i=X(V(Z(n))),s=i.coordinates,c=K(i.arcs.length*1.4,en,rn);n=i.objects,i.bbox=o,i.arcs=i.arcs.map(function(t,d){return c.set(t,d),s.slice(t[0],t[1]+1)}),delete i.coordinates,s=null;function l(t){t&&O.call(h,t.type)&&h[t.type](t)}var h={GeometryCollection:function(t){t.geometries.forEach(l)},LineString:function(t){t.arcs=g(t.arcs)},MultiLineString:function(t){t.arcs=t.arcs.map(g)},Polygon:function(t){t.arcs=t.arcs.map(g)},MultiPolygon:function(t){t.arcs=t.arcs.map(v)}};function g(t){var d=[];do{var y=c.get(t);d.push(t[0]<t[1]?y:~y)}while(t=t.next);return d}function v(t){return t.map(g)}for(var r in n)l(n[r]);return a&&(i.transform=a,i.arcs=Y(i.arcs)),i}function en(n){var e=n[0],o=n[1],a;return o<e&&(a=e,e=o,o=a),e+31*o}function rn(n,e){var o=n[0],a=n[1],i=e[0],s=e[1],c;return a<o&&(c=o,o=a,a=c),s<i&&(c=i,i=s,s=c),o===i&&a===s}export{tn as t};