// Join Reasonably

// joins the open paths in the selection together with reasonable order


// test env: Adobe Illustrator CS3, CS6 (Windows)

// Copyright(c) 2004 Hiroyuki Sato
// https://github.com/shspage
// This script is distributed under the MIT License.
// See the LICENSE file for details.

// 2018.07.20, modified to ignore locked/hidden objects in a selected group

var conf = {};
// Settings ==================================

conf.close = true;     // make a closed path. true/false
                        // (make closed paths when conf.ignore_if_further_than > 0)

conf.marge_if_nearer_than   = 0.5;  // merge the ends to connect within this distance
                                    // set 0 to be ignored (unit:mm)

conf.ignore_if_further_than = 0;  // ignore to connect if distance between the ends exceeds this value
                                  // set 0 to be ignored (unit:mm)

conf.hanLen = 0.33; // ratio of handle length to connected line. set 0 to be ignored

conf.dontAddRevHan = 120; // do not generate a handle if the angle of the connecting part is more than this value.
                          // set 0 to be ignored (unit:degree, 0-180)

// ========================================
var mpi = Math.PI;
var hpi = mpi / 2; // half PI

conf.dontAddRevHan *= mpi / 180;
function mm2pt(mm){  return mm * 2.83464567;  }
conf.marge_if_nearer_than = mm2pt(conf.marge_if_nearer_than);
conf.ignore_if_further_than = mm2pt(conf.ignore_if_further_than);
conf.ignore_if_further_than_squared = conf.ignore_if_further_than * conf.ignore_if_further_than

main();
function main(){
  var s = [];
  getPathItemsInSelection(1, s);
  if(s.length < 2) return; // it needs at least 2 paths

  for(var i = 0, iend = s.length; i < iend; i++){
    readjustAnchors(s[i], conf.marge_if_nearer_than);
  }

  var pitem = s.shift(); // pick up the first path.
                      // then, connect the rest of paths to this.
                      // so, properties of the result path is the same as this path.
  var pitems = [pitem];
  var p  = pitem.pathPoints;
  var z = p.length - 1;

  var pinfo = {
      d : null,         // squared distance
      child : null,     // PathItem
      cIdx : null,      // child index in extracted selection
      pPntIdx : null,   // pathPoints index of parent
      cPntIdx : null    // pathPoints index of child
  };
  var p2, z2;
  
  while(s.length > 0){
    pinfo.child = null;
    
    for(var i = 0, iend = s.length; i < iend; i++){
      p2 = s[i].pathPoints;
      z2 = p2.length - 1;
      cmpLen(pinfo, p, p2, i, 0, 0);
      cmpLen(pinfo, p, p2, i, 0, z2);
      cmpLen(pinfo, p, p2, i, z, 0);
      cmpLen(pinfo, p, p2, i, z, z2);
      if(pinfo.d == 0) break;
    }

    s.splice( pinfo.cIdx, 1 );
    
    if(conf.ignore_if_further_than> 0
       && pinfo.d > conf.ignore_if_further_than_squared){
      pitem = pinfo.child;
      p = pitem.pathPoints;
      z = p.length - 1;
      pitems.push(pitem);
    } else {
      if(pinfo.pPntIdx == 0) pireverse(pitem);
      if(pinfo.cPntIdx > 0)  pireverse(pinfo.child);
      pijoin(pitem, pinfo.child);
      z = p.length - 1;
    }
  }

  if(conf.close){
    for(var i = 0, iend = pitems.length; i < iend; i++){
      p = pitems[i].pathPoints;
      z = p.length-1;
      if(conf.ignore_if_further_than > 0
        && dist2(p[0].anchor, p[z].anchor) > conf.ignore_if_further_than_squared){
        continue;
      }
      adjustHandleLen( p[z], p[0]);
      pitems[i].closed = true;
    }
  }

  for(var i = 0, iend = pitems.length; i < iend; i++){
    readjustAnchors(pitems[i]);
  }
}
// ------------------------------------------------
function cmpLen(pinfo, p, p2, i, idx1, idx2){
  var d = dist2( p[idx1].anchor, p2[idx2].anchor);
  if(!pinfo.child || d < pinfo.d){
    pinfo.d = d;               // squared distance
    pinfo.child = p2.parent;   // PathItem
    pinfo.cIdx = i;            // child index in extracted selection
    pinfo.pPntIdx = idx1;      // pathPoints index of parent
    pinfo.cPntIdx = idx2;      // pathPoints index of child
  }
}
// ------------------------------------------------
// adjust the length of handles
function adjustHandleLen(p1, p2){
  var d = dist(p1.anchor, p2.anchor);
  
  if(d == 0){ // distance is 0
    p2.leftDirection = p1.leftDirection;
    p1.remove();
    
  } else if(d < conf.marge_if_nearer_than){
    var pnt = [ (p1.anchor[0] + p2.anchor[0]) / 2,
                (p1.anchor[1] + p2.anchor[1]) / 2 ];
    p2.rightDirection = [ p2.rightDirection[0] + (pnt[0] - p2.anchor[0]),
                          p2.rightDirection[1] + (pnt[1] - p2.anchor[1]) ];
    p2.leftDirection =  [ p1.leftDirection[0] + (pnt[0] - p1.anchor[0]),
                          p1.leftDirection[1] + (pnt[1] - p1.anchor[1]) ];
    p2.anchor = pnt;
    p1.remove();
    
  } else if(conf.hanLen > 0){
    d *= conf.hanLen;
    var d2 = d * d;
    if(!arrEq(p1.anchor, p1.rightDirection)){
      if(conf.dontAddRevHan
         && getRad2(p2.anchor, p1.anchor, p1.rightDirection) > conf.dontAddRevHan){
        p1.rightDirection = p1.anchor;
      } else if(dist2(p1.anchor, p1.rightDirection) > d2){
        p1.rightDirection = getPnt(p1.anchor, getRad(p1.anchor, p1.rightDirection), d);
      }
    }
    if(!arrEq(p2.anchor, p2.leftDirection)){
      if(conf.dontAddRevHan
         && getRad2(p1.anchor, p2.anchor, p2.leftDirection) > conf.dontAddRevHan){
        p2.leftDirection = p2.anchor;
      } else if(dist2(p2.anchor, p2.leftDirection) > d2){
        p2.leftDirection = getPnt(p2.anchor, getRad(p2.anchor, p2.leftDirection), d);
      }
    }
    
  } else {
    p1.rightDirection = p1.anchor;
    p2.leftDirection  = p2.anchor;
  }
}
// ----------------------------------------------
// return angle of the line drawn from "p1" [x,y] to "p2" [x,y]
function getRad(p1, p2) {
  return Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
}
// ----------------------------------------------
// return angle of the polygonal line drawn through "p1" [x,y], "o" [x,y], "p2" [x,y]
// ( 0 - Math.PI)
function getRad2(p1, o, p2){
  var v1 = normalize(p1,o);
  var v2 = normalize(p2,o);
  return Math.acos(v1[0]*v2[0]+v1[1]*v2[1]);
}
// ------------------------------------------------
function normalize(p, o){
  var d = dist(p,o);
  return d==0 ? [0,0] : [(p[0]-o[0])/d, (p[1]-o[1])/d];
}
// ------------------------------------------------
// return distance between "p1" [x, y] and "p2" [x, y]
function dist(p1, p2) {
  return Math.sqrt(dist2(p1, p2));
}
// ------------------------------------------------
// return square of distance
function dist2(p1, p2) {
  var dx = p1[0] - p2[0];
  var dy = p1[1] - p2[1];
  return dx*dx + dy*dy;
}
// ------------------------------------------------
// return true if all the values in arrays "arr1" and "arr2" is same
function arrEq(arr1,arr2) {
  for(var i=0, iend = arr1.length; i < iend; i++){
    if(arr1[i] != arr2[i]) return false;
  }
  return true;
}
// ------------------------------------------------
// reverse the order of pathPoints in PathItem "pitem"
function pireverse(pitem){
  var pp = pitem.pathPoints;
  var arr = new Array(pp.length);
  var z = pp.length - 1;
    
  for(var i=0; i <= z; i++) {
    var p = pp[i];
    arr[z - i] = [p.anchor, p.rightDirection, p.leftDirection, p.pointType];
  }

  for(var i=0; i <= z; i++) {
    var p = pp[i];
    var r = arr[i];
    p.anchor         = r[0];
    p.leftDirection  = r[1];
    p.rightDirection = r[2];
    p.pointType      = r[3];
  }
}
// -----------------------------------------
// join the 1st anchor of PathItem "pi2"
// and the last anchor of PathItem "pi1"
function pijoin(pi1, pi2){
  var p1 = pi1.pathPoints;
  var p2 = pi2.pathPoints;
  adjustHandleLen(p1[p1.length-1], p2[0]);
    
  for(var i=0, iend = p2.length; i < iend; i++){
    var pp1 = p1.add();
    var p2i = p2[i];
    pp1.anchor         = p2i.anchor;
    pp1.rightDirection = p2i.rightDirection;
    pp1.leftDirection  = p2i.leftDirection;
    pp1.pointType      = p2i.pointType;
  }
  pi2.remove();
}

// ----------------------------------------------
function getPnt(pnt, rad, dis){
  return [pnt[0] + Math.cos(rad) * dis,
          pnt[1] + Math.sin(rad) * dis];
}
// ------------------------------------------------
// extract PathItems from the selection which length of PathPoints
// is greater than "n"
function getPathItemsInSelection(n, paths){
  if(documents.length < 1) return;
  
  var s = activeDocument.selection;
  
  if (!(s instanceof Array) || s.length < 1) return;

  extractPaths(s, n, paths);
}

// --------------------------------------
// extract PathItems from "s" (Array of PageItems -- ex. selection),
// and put them into an Array "paths".  If "pp_length_limit" is specified,
// this function extracts PathItems which PathPoints length is greater
// than this number.
function extractPaths(s, pp_length_limit, paths){
  for(var i = 0, iend = s.length; i < iend; i++){
    if(s[i].locked || s[i].hidden){
      continue;
    } else if(s[i].typename == "PathItem"){
      if((pp_length_limit && s[i].pathPoints.length <= pp_length_limit)
        || s[i].closed || s[i].guides || s[i].clipping){
        continue;
      }
      paths.push(s[i]);
      
    } else if(s[i].typename == "GroupItem"){
      // search for PathItems in GroupItem, recursively
      extractPaths(s[i].pageItems, pp_length_limit, paths);
      
    } else if(s[i].typename == "CompoundPathItem"){
      // searches for pathitems in CompoundPathItem, recursively
      // ( ### Grouped PathItems in CompoundPathItem are ignored ### )
      extractPaths(s[i].pathItems, pp_length_limit , paths);
    }
  }
}
// --------------------------------------
function readjustAnchors(pitem, marge_if_nearer_than){
  var pp = pitem.pathPoints;
  if(marge_if_nearer_than == 0) return;
  if(pp.length < 2) return;

  // Settings ==========================

  var minDist = marge_if_nearer_than;
  minDist *= minDist;
  
  // ===================================

  if(pitem.closed){
    for(var i=pp.length-1;i>=1;i--){
      if(dist2(pp[0].anchor, pp[i].anchor) < minDist){
        pp[0].leftDirection = pp[i].leftDirection;
        pp[i].remove();
      } else { break; }
    }
  }
  for(var i=pp.length-1;i>=1;i--){
    if(dist2(pp[i].anchor, pp[i-1].anchor) < minDist){
      pp[i-1].rightDirection = pp[i].rightDirection;
      pp[i].remove();
    }
  }
}

