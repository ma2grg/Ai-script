#target Illustrator

//  script.name = textBlock_CS4.jsx; 
//  script.description = converts selected point textFrames into a Block of Text;
//  script.required = one document with at least two selected Point Text frames;
//  script.parent = carlos canto // 12/4/11; Update 03/15/205 added User Defined Units, cosmetics
//  script.elegant = false;

function main () {
if (app.documents.length > 0) {

    var idoc = app.activeDocument;
    var sel = idoc.selection;
    if (sel.length>1) {
        var width = prompt ("Enter desired Text Block width including Units", '300 pt', "Text Block"); // 
        if (width!=null) { // quit if pressed Cancel
            var widthUV = new UnitValue(width);
            if (widthUV.type=='?') {alert('Units were not provided, try again...'); return}
            var widthPts = widthUV.as ("pt") // convert to points
            
            var spacing = prompt ("Enter spacing including Units", '3 mm', "Text Block"); // text lines spacing in mm
            
            var spcingUV = new UnitValue(spacing);
            if (spcingUV.type=='?') {alert('Units were not provided, try again...'); return}
            var spacingPts = spcingUV.as ("pt") // convert to points
            
            var dupLayer = idoc.layers.add(); // add a layer to place the new block of text
            dupLayer.name = "Text Block";
            var blockGrp = dupLayer.groupItems.add(); // add a group to final output
            blockGrp.name = "Text Block";
            
            var left = 0; //idoc.width/3; // place block at the bottom 3rd of the page
            var top = 0; //-idoc.height/3

            for (i=0; i<sel.length; i++) { // loop thru selection
                if (sel[i].typename == "TextFrame") { // continue if textFrame, ignore other pageItems
                    var tf=sel[i];
                    var itext = tf.duplicate(blockGrp, ElementPlacement.PLACEATEND); // duplicate text
                    itext.selected = false; // deselect it
                    grpName = itext.contents; // get contents to name outline group
                    var ioutlined = itext.createOutline(); // create outlines
                    ioutlined.name = grpName; // rename group
                    
                    var perCent = widthPts/ioutlined.width*100; // get scaling percentage, based on desired width of block
                    var scaleMatrix = app.getScaleMatrix(perCent, perCent);
                    ioutlined.transform (scaleMatrix); // scale outlined text
                    
                    ioutlined.left = left; // position text
                    ioutlined.top = top+ioutlined.height+spacingPts; // top = previous item top + spacing + current item
                    top = ioutlined.top // get current top to use on next item
                } // end if - non text frames
            } // end for loop - selection
            blockGrp.position = [tf.left+tf.width+40, tf.top+20];
        } // end check prompt for calcel
    } // end if selection > 1
    else {
        alert ("Select at least 2 Point Text Frames before running");				
    }
} // end at least one document
else {
    alert ("There are no open documents");
}
} // end main

main ();