// Hi there, welcome.
//
// This code was thrown together over a couple of days and makes little effort
// to be efficient in any way. Fabric.js is buggy as hell and this thing is held 
// together with duct tape, spit and luck. If you're going to be tinkering with the
// code I apologise in advance, this thing is so full of cludge fixes I lost count.
//
// I've tried to throw in some useful console logging. It's not exactly verbose logging
// but it'll provide enough jumping off points, although admittedly I got distracted in
// some places making Clem have a bit of fun.
//
// No support for this code is provided. I wrote this without the 
// intention of future development, but you can feel free to adjust it/modify it/update
// it/destroy it for whatever you like. Just don't be an asshole. If you make any money 
// from it, I'd like some of it. Simples!
//
// Thanks to GitHub user lukepot for providing the Novemeber 2019 changes.
//
// Written by stom@stom66.co.uk. 
//
// Weee! Off we go!
//-----------------------------------------------------------------
// Choose settings
	var snap_size         = 20,
		rotate_angle_snap = 22.5,
		canvas_width      = $("#dojo_canvas_parent").width(),
		canvas_height     = $("#dojo_canvas_parent").height(),
		zoomLevel         = 0,
		zoomLevelMin      = -7,
		zoomLevelMax      = 0,
		panning           = false,
		clean_slate       = true,
		base_url          = [location.protocol, '//', location.host, location.pathname].join(''),
		room_count        = 0,
		power_count       = 0,
		capacity_count    = 0,
		pastebin_id       = false;

// Work out the tile categories from previously included tiles.js
	var categories = [];
	$.each(tiles.map(function(value,index) {
		return value[1];
	}), function(i, x){
		if($.inArray(x, categories) === -1) categories.push(x);
	});

// Work out the max canvas dimensions
	if (canvas_width>canvas_height) {
		canvas_max_wh = canvas_width;
	} else {
		canvas_max_wh = canvas_height;
	}

// Create the canvas
	var canvas = new fabric.Canvas('dojo_canvas', { 
		selection: 	 	true, 
		height:		 	canvas_height, 
		width: 		 	canvas_width,
		hoverCursor: 	'move',
		moveCursor: 	'move'
	});

// On move, snap to grid
	canvas.on('object:moving', function(options) { 
		options.target.set({
			left: Math.round(options.target.left / snap_size) * snap_size,
			top: Math.round(options.target.top / snap_size) * snap_size
		});
	});

// On rotate, snap to angle
	canvas.on('object:rotating', function(options) {
		options.target.angle = Math.round(options.target.angle / rotate_angle_snap) * rotate_angle_snap;
	});

// Mobile pinch/gesture controls
    canvas.on({
        'touch:gesture': function(e) {
            if (e.e.touches && e.e.touches.length == 2) {
                pausePanning = true;
                var point = new fabric.Point(e.self.x, e.self.y);
                if (e.self.state == "start") {
                    zoomStartScale = self.canvas.getZoom();
                }
                var delta = zoomStartScale * e.self.scale;
                self.canvas.zoomToPoint(point, delta);
                pausePanning = false;
            }
        },
        'object:selected': function() {
            pausePanning = true;
        },
        'selection:cleared': function() {
            pausePanning = false;
        },
        'touch:drag': function(e) {
            if (pausePanning == false && undefined != e.e.layerX && undefined != e.e.layerY) {
				currentX = e.e.layerX;
				currentY = e.e.layerY;
				xChange  = currentX - lastX;
				yChange  = currentY - lastY;

                if( (Math.abs(currentX - lastX) <= 50) && (Math.abs(currentY - lastY) <= 50)) {
                    var delta = new fabric.Point(xChange, yChange);
                    canvas.relativePan(delta);
                }

                lastX = e.e.layerX;
                lastY = e.e.layerY;
            }
        }
    });

// Start of Canvas functions
//-----------------------------------------------------------------
// Add an image to the canvas
	function canvas_addTile(id, x, y) {
		if (!x || !y) {
			topRight = canvas_getVisibleCorner("tr");
			x = topRight.x - tiles[id][3] - 50;
			y = topRight.y + 50;
		}
		fabric.loadSVGFromURL(tiles[id][0], function(objects, options) {
			var svg = fabric.util.groupSVGElements(objects, options);
			svg.set({
				left: x,
				top: y,
				width: tiles[id][3],
				height: tiles[id][4],
				hasBorders: true,
				hasControls: true,
				lockScalingFlip: true,
				borderColor: '#fff',
				dojo_cap: tiles[id][5],
				dojo_power: tiles[id][6],
				dojo_room: true
			});
			svg.setControlsVisibility({
				mt: false,
				mb: false,
				ml: false,
				mr: false,
				tr: false,
				tl: false,
				br: false,
				bl: false,
				mtr: true
			});
			svg.scaleToWidth(tiles[id][3]);
			svg.scaleToHeight(tiles[id][4]);
			canvas.add(svg);
			canvas.renderAll();

			// Adjust counters
			gui_dojoStats(1, tiles[id][6], tiles[id][5]);
		});
	}

// Add a FontAwesome icon to the canvas (webfont method)
	function canvas_addIcon(i = 1, x, y) {
		if (!x || !y) {
			topRight = canvas_getVisibleCorner("tr");
			x = topRight.x - 20;
			y = topRight.y + 20;
		}
		var icon = new fabric.Text(fontAwesomeIcons[i][1],{
			left: x,
			top: y,
			fill: 'white',
			originX: 'right', originY: 'top',
			fontSize:60,
			fontFamily:'FontAwesome',
			fontWeight:500
		});
		canvas.add(icon);
	}

// Add a FontAwesome icon to the canvas (svg path method)
	function canvas_addIconSVG(i = 1, x, y) {
		if (!x || !y) {
			topRight = canvas_getVisibleCorner("tr");
			x = topRight.x - 20;
			y = topRight.y + 20;
		}
		var path = new fabric.Path(fontAwesomeIcons[i][2],{
			left: x,
			top: y,
			originX: 'right', 
			originY: 'top',
			height: 100,
			width: 100,
			flipX: true,
			flipY: true,
			hasBorders: true,
			hasControls: true,
			lockScalingFlip: true,
			scaleX: 0.1,
			scaleY: 0.1,
			fill: 'white',
			stroke: 'white',
		});
		canvas.add(path);
	}

// Add Text to the canvas
	function canvas_addLabel(label = "Enter text",x, y) {
		if (!x || !y) {
			topRight = canvas_getVisibleCorner("tr");
			x = topRight.x - 20;
			y = topRight.y + 20;
		}
		var text = new fabric.IText(label,{
			left: x,
			top: y,
			fill: 'white',
			originX: 'right', originY: 'top',
			fontSize:100,
			fontFamily:'Open Sans Condensed'
		});
		canvas.add(text);
	}

// Add an Image from URL to the canvas
	function canvas_addImageFromURL(url, x, y) {
		fabric.Image.fromURL(url, function(object) {
			if (!x || !y) {
				topRight = canvas_getVisibleCorner("tr");
				x = topRight.x - 20;
				y = topRight.y + 20;
			}
			object.set({
				left: x - object.width,
				top: y,
				originX: 'right', originY: 'top',
			});
			canvas.add(object);
			$("#modal_import_image").modal('hide');
		})
	}

// Add an image from a local src to the canvas
	function canvas_addImageFromSrc(imgObj, x, y) {
		if (!x || !y) {
			topRight = canvas_getVisibleCorner("tr");
			x = topRight.x - 20;
			y = topRight.y + 20;
		}
		var image = new fabric.Image(imgObj);
		image.set({
			left: x - imgObj.width,
			top: y,
				originX: 'right', originY: 'top',
			angle: 0
		});
		canvas.add(image);
		$("#modal_import_image").modal('hide');
	}

// Ungroup objects
	function canvas_ungroupObjects(group) {
		var destroyedGroup = group.destroy();
		var items = destroyedGroup.getObjects();
		//canvas.remove(group);
		items.forEach(function (item) {
			canvas.add(item);
		});
		canvas.remove(group);
	}

// Remove an object
	function canvas_removeObject(object) {
		console.log("Clem shall slay ",object);
		canvas.remove(object);
		console.log("It is done.");
		gui_reCalcDojoStats();
		canvas.renderAll();
	}

// Get the coordinates of the current top-right corner
	function canvas_getVisibleCorner(corner) {
		var result = [];
		result.y = (canvas.calcViewportBoundaries()[corner]["y"]);
		result.x = (canvas.calcViewportBoundaries()[corner]["x"]);
		return result;
	}

// Clone an object
	function canvas_cloneObject(object, left_offset) {
		var propertiesToInclude = [
			'left', 'top',
			'hasBorders', 'hasControls',
			'dojo_room', 'dojo_cap', 'dojo_power',
			'borderColor', 'lockScalingFlip',
		];
		object.clone(function(cloned) {
			canvas.discardActiveObject();
			cloned.set({
				left: cloned.left + left_offset,
				top: cloned.top,
				evented: true,
			});
			if (object.type=="group") {
				cloned.setControlsVisibility({
					mt: false,
					mb: false,
					ml: false,
					mr: false,
					tr: false,
					tl: false,
					br: false,
					bl: false,
					mtr: true
				});
			}
			if (cloned.type === 'activeSelection') {
				// active selection needs a reference to the canvas.
				cloned.canvas = canvas;
				cloned.forEachObject(function(obj) {
					canvas.add(obj);
				});
				// this should solve the unselectability
				cloned.setCoords();
			} else {
				canvas.add(cloned);
			}
			canvas.setActiveObject(cloned);
			canvas.requestRenderAll();
			console.log("Clem underwent mitosis and produced a ",object.type);
		}, propertiesToInclude)
		gui_reCalcDojoStats();
	}

// Change color of the active element
	function changeColor(color, object) {
		console.log("Clem paints the walls in "+color);
		if (object && object.get('type')!=="activeSelection") {
			console.log("type: "+object.get('type'));
			console.log(object);
			if (object._objects) {
				object._objects.forEach(function(path) {
					// This bit is a little weird. We're repainting the paths found within the SVG, unless they have 
					// an opacity of 0.5 or 0. 
					// Dots in the corners have an opacity of 0 and serve to prevent cropping of the SVG tiles.
					// Pillars are black, with an opacity of 0.5, and serve to darken the color underneath them.
					// Spectrum.js doesn't support RGBA so we need to do a bit of buggering about to make sure we don't
					// over-ride these default values.
					if (path.fill.indexOf("rgba") !== -1) {
						var alpha = path.fill.split(",")[path.fill.split(",").length-1].slice(0, -1)
					} else {
						alpha = 1;
					}
					if ((path.fill!=="rgba(0,0,0,0.5)") && (alpha > 0)) {
						console.log("Clem is painting path ",path);
						path.fill = color;
					}
				});
			}
			object.set({
				fill: color, 
				color: color,
				fillColor: color
			});
			// Updating an SVG's colors doesnt seem to affect it (even after calling renderAll), but zooming and 
			// selecting/deselecting everything on the canvas did. Could *not* get this working, so the workaround 
			// is just clone the object on top of itself, which forces it to take on the new style, and then delete 
			// the old one. 
			canvas_cloneObject(object, 0);
			canvas_removeObject(object);
		}
	}

// Viewport Control Functions
//----------------------------------------------------------------
// Setup Zoom functions
	function zoomIn(point) {
		if (zoomLevel < zoomLevelMax) {
			zoomLevel++;
			canvas.zoomToPoint(point, Math.pow(1.5, zoomLevel));
			console.log("Clem sets his vision to "+zoomLevel+", and has a target: ",point);
		}
	}

	function zoomOut(point) {
		if (zoomLevel > zoomLevelMin) {
			zoomLevel--;
			canvas.zoomToPoint(point, Math.pow(1.5, zoomLevel));
			console.log("Clem sets his vision to "+zoomLevel+", and has a target: ",point);
		}
	}
	function canvas_scrollZoom(event) {
		if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
			var delta = -event.originalEvent.detail;
			console.log("Clem spies burning kubrow");
		} else {
			var delta = event.originalEvent.wheelDelta;
		}
		if (delta != 0) {
			console.log("Clem points to ",event.originalEvent.offsetX, event.originalEvent.offsetY);
			var point = new fabric.Point(event.originalEvent.offsetX, event.originalEvent.offsetY);
			if (delta > 0) {
				zoomIn(point);
			} else if (delta < 0) {
				zoomOut(point);
			}
		}
	}

// Bind mouse Controls
//-----------------------------------------------------------------
// Bind right click to delete
	$("#dojo_canvas_parent").bind('contextmenu', function(event) {
		console.log("Clem leans to the right");
	    console.log(event);
		var point = new fabric.Point(event.originalEvent.offsetX, event.originalEvent.offsetY);
	    canvas.getObjects().forEach(function(object) {
	        if (object.containsPoint(point)) {
	            console.log("Clem found a shiny!",object);
	            canvas_removeObject(object);
	        }
	    });
	    event.preventDefault();
	    return false;
	});

// Bind scroll to zoom
	jQuery('html').on('DOMMouseScroll', function(event) {
		canvas_scrollZoom(event);
	});
	jQuery('.canvas-container').on('mousewheel', function(event) {
		canvas_scrollZoom(event);
	});

// Bind middle click to pan
	function startPan(event) {
		//old logic to also bind to mouse1 and check there's no active object. Worked well! Given the boot by multiselect.
		//if (!((event.button == 1) || ((event.button==0) && !canvas.getActiveObject()))) {
		if (event.button !== 1) {
			return;
		}
		console.log("Clem gets knocked down");
		var x0 = event.screenX,
		y0 = event.screenY;
		function continuePan(event) {
			//console.log("Clem jiggles");
			var x = event.screenX, y = event.screenY;
			canvas.relativePan({ x: x - (Math.round(x0 / 2) * 2), y: y - (Math.round(y0 / 2 * 2)) });
			x0 = x;
			y0 = y;
			canvas.renderAll();
		}
		function stopPan(event) {
			$(window).off('mousemove', continuePan);
			$(window).off('mouseup', stopPan);
			var x = event.screenX, y = event.screenY;
			canvas.relativePan({ x: x - (Math.round(x0 / (snap_size/2)) * (snap_size/2)), y: y - (Math.round(y0 / (snap_size/2) * (snap_size/2))) });
			console.log("Clem gets up again");
			console.log("(Cause youre never gonna keep Clem down)");
		};
		$(window).mousemove(continuePan);
		$(window).mouseup(stopPan);
		$(window).contextmenu(cancelMenu);
	};
	function cancelMenu() {
		$(window).off('contextmenu', cancelMenu);
		return false;
	}
	$("#dojo_canvas_parent").mousedown(startPan);

// Bind keyboard shortcuts
	$(document).keydown(function(event) {
		var key_pressed = event.which;
		var key_binds = [67, 68, 82, 37, 38, 39, 40];

		if (canvas.getActiveObject() !== null) {
			var object  = canvas.getActiveObject();
			var type 	=  object.get('type');
			console.log("Clem is looking at an", type);
			if (type=="activeSelection") {
				// This detects if a group of objects has been selected
				var group = object;
				console.log("Clem is looking at a group!",group);
			}
		}
		if ($.inArray(key_pressed, key_binds) >= 0 && !object.isEditing) {
			if (object || group) {
				switch (key_pressed) {
			  		case 67: // C | Begin the Cloning procedure
						var propertiesToInclude = [
							'left',
							'hasBorders', 'hasControls',
							'dojo_room', 'dojo_cap', 'dojo_power',
							'borderColor', 'lockScalingFlip',
						];
			  			canvas.getActiveObject().clone(function(cloned) {
							_clipboard = cloned;
						}, propertiesToInclude);
						canvas_cloneObject(_clipboard, object.width);
						break;

			  		case 68: // D | Fire the Deletion Laser!
						if (type!=="activeSelection") {
							canvas_removeObject(object);
						} else {
		       				if (confirm('Delete this group of '+object._objects.length+' items?')) {
			            		group.getObjects().forEach(function(object) {
			            			canvas_removeObject(object);
			            		});
								canvas.discardActiveGroup();
			            	}
						}
						break;

			  		case 82: // R | Rrrrrrrotate on my mark! Mark!
			  			console.log("Clem spins right round, like record");
			  			var angle = object.angle + 90;
						object.rotate(angle);
						canvas.requestRenderAll();
						break;

			  		case 37: // Left arrow
			  			console.log("Clem shuggles left");
			  			object.set({
			  				left: object.left - snap_size
			  			});
			  			object.setCoords();
			  			canvas.renderAll();
						break;

			  		case 38: // Up arrow
			  			console.log("Clem shuggles up");
			  			object.set({
			  				top: object.top - snap_size
			  			});
			  			object.setCoords();
			  			canvas.renderAll();
						break;

			  		case 39: // Right arrow
			  			console.log("Clem shuggles right");
			  			object.set({
			  				left: object.left + snap_size
			  			});
			  			object.setCoords();
			  			canvas.renderAll();
						break;

			  		case 40: // Down arrow
			  			console.log("Clem shuggles down");
			  			object.set({
			  				top: object.top + snap_size
			  			});
			  			object.setCoords();
			  			canvas.renderAll();
						break;
			  	}
		  	}
		  } else {
			console.log("Clem does not recognise this symbol",event.which);
		  }
  	});

// Start of GUI functions
//-----------------------------------------------------------------
// Functions to add navbar buttons and dropdowns
	function gui_addNavbarCategories() {
		categories.forEach(function(cat, i) {
			$("#top_nav").append('<li class="nav-item dropdown" id="top_nav_cat_'+i+'"><a class="nav-link dropdown-toggle" href="#" id="navbarDropdown'+cat+'" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">'+cat+'</a><div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbarDropdown"></div></li>');
		});
	}

// Add the available dojo tiles to the navbar
	function gui_addNavbarTiles() {
		categories.forEach(function(cat, i_cat) {
			tiles.forEach(function(tile, i_tile) {
				if (tile[1]==cat) {
					$("#top_nav_cat_"+i_cat+" > div").append('<a class="dropdown-item" onclick="canvas_addTile('+i_tile+')">'+tile[2]+'</a>');
				}
			});
		});
	}

// Add the FontAwesome icons to the navbar
	function gui_addNavbarIcons() {
		var menu = "#top_nav_cat_markers";
		fontAwesomeIcons.forEach(function(icon, i) {
			$(menu).append('<a class="dropdown-item" onclick="canvas_addIconSVG('+i+')"><i class="fa '+icon[0]+'"></i></a>');
		});
	}

// Update the Pastebin response area with a suitable message
	function pastebinMessage(type, message, paste) {
		messages = [
			["fa-exclamation-triangle", "Error!", "btn-danger"],
			["fa-check", "Copied!", "btn-success"]
		];
		$("#gui_btn_pastebin").html('<i class="fa '+messages[type][0]+' mr-1"></i> '+messages[type][1]+'').toggleClass(messages[type][2]);
		if (type==1) {
			var share_url = base_url + "?p=" + paste;
			$("#output_p_link a").attr("href", share_url);
			$("#output_p_link a").text(share_url);
			$("#output_p_link span").text('');
			if ($("#output_p_link").hasClass("hide")) {
				$("#output_p_link").toggleClass("hide show");
			}
		} else {
			$("#output_p_link a").attr("href", '#');
			$("#output_p_link a").text('');
			$("#output_p_link span").text(message);
			if ($("#output_p_link").hasClass("hide")) {
				$("#output_p_link").toggleClass("hide show");
			}
		}
		setTimeout(function(){ 
			if ($("#gui_btn_pastebin").toggleClass(messages[type][2])) {
				$("#gui_btn_pastebin").toggleClass("btn-default");
				$("#gui_btn_pastebin").html('Import');
			}
		}, 3000);
	}

// Update dojo stats
	function gui_dojoStats(room, power, cap) {
		if (Number.isInteger(room) && Number.isInteger(power) && Number.isInteger(cap)) {
			console.log("Clem takes stock of his surroundings and yells, '"+room+" "+power+" "+cap+"!'");
			room_count += room;
			power_count += power;
			capacity_count += cap;
			$("#room_count").html(room_count);
			$("#power_count").html(power_count);
			$("#capacity_count").html(capacity_count);
			if (room_count < 1) {
				$("#room_count_wrapper").addClass("text-danger text-strong");
			} else {
				$("#room_count_wrapper").removeClass("text-danger text-strong");
			}
			if (power_count < 1) {
				$("#power_count_wrapper").addClass("text-danger text-strong");
			} else {
				$("#power_count_wrapper").removeClass("text-danger text-strong");
			}
			if (capacity_count < 1) {
				$("#capacity_count_wrapper").addClass("text-danger text-strong");
			} else {
				$("#capacity_count_wrapper").removeClass("text-danger text-strong");
			}
		} else {
			console.log("Clem looks around, then starts scremaing for his NaN");
		}
	}

// ReCalculate Dojo stats entirely
	function gui_reCalcDojoStats() {
		room_count = 0;
		capacity_count = 0;
		power_count = 0;
		canvas.getObjects().forEach(function (object) {
			if (object.get('dojo_room')) {
				var cap =  object.get('dojo_cap');
				var power =  object.get('dojo_power');
				gui_dojoStats(1, power, cap);
			}
		});
	}

// Clear the import area
	function clearTextareaInput() {
		$("#textarea_data_input").text("");
		$("#textarea_data_input").val("");
	}

// Copy the current JSON save data to the clipboard
	function copyToClipboard(element) {
		$(element).select();
    	if (document.execCommand('copy')) {
    		$("#gui_btn_copy_data").html('<i class="fa fa-check mr-1"></i> Copied!');
    		$("#gui_btn_copy_data").removeClass("btn-primary").addClass("btn-success");
    	} else {
    		$("#gui_btn_copy_data").html('<i class="fa fa-exclamation-triangle mr-1"></i> Error!');
    		$("#gui_btn_copy_data").removeClass("btn-primary").addClass("btn-danger");
    	}
    }

// Bind navbar buttons to their functions
	$('#gui_btn_load_data').click(function(){
		loadData();
	});

	$('#gui_btn_modal_save').click(function(){
		saveData();
	});

	$('#gui_btn_zoom_out').click(function(){
		var point = new fabric.Point(canvas_width / 2, canvas_height / 2);
		zoomOut(point);
	});

	$('#gui_btn_zoom_in').click(function(){
		var point = new fabric.Point(canvas_width / 2, canvas_height / 2);
		zoomIn(point);
	});

	$('#gui_btn_grid_toggle').click(function(){
		$(this).toggleClass("btn-primary btn-secondary");
		$('#gui_btn_grid_toggle > i').toggleClass("fa-square-o fa-plus-square-o");
		$("canvas").toggleClass("grid");
	});

	$('#gui_btn_add_text').click(function(){
		canvas_addLabel();
	});

	$('#modal_instructions').on('shown.bs.modal', function () {
		console.log("Clem rummages through his inventory to see what tools he has for the job ahead.")
	});
	$('#modal_instructions').on('hidden.bs.modal', function () {
		console.log("Reassured, he heads off on his journey.")
	});

	$('#modal_about').on('shown.bs.modal', function () {
		console.log("Clem reads the label on his backpack. 'Hand wash only' Clem does not know what this means.")
	});
	$('#modal_about').on('hidden.bs.modal', function () {
		console.log("Clem figures its probably okay to ginore it.")
	});

// Setup the Spectrum color picker
	$("#input_color").spectrum({
		color: "#6aa84f",
		showInput: true,
		className: "full-spectrum",
		showInitial: true,
		showPalette: true,
		showSelectionPalette: true,
		maxSelectionSize: 10,
		preferredFormat: "hex",
		localStorageKey: "spectrum.demo",
		move: function (color) {
			var new_color = color.toHexString();
			var object = canvas.getActiveObject();
		    changeColor(new_color, object);	    
		},
		show: function () {},
		beforeShow: function () {},
		hide: function () {},
		change: function() {},
		palette: [
		    ["rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)",
		    "rgb(204, 204, 204)", "rgb(217, 217, 217)","rgb(255, 255, 255)"],
		    ["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)",
		    "rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)"], 
		    ["rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)", 
		    "rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)", 
		    "rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)", 
		    "rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)", 
		    "rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)", 
		    "rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)",
		    "rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)",
		    "rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)",
		    "rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)", 
		    "rgb(12, 52, 61)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)"]
		]
	});

// Bind misc GUI components to functions
	$("#gui_btn_copy_data").click(function() {
		copyToClipboard("#textarea_data");		
	});

	$('#gui_btn_clear_data_input').click(function(){
		clearTextareaInput();
	});

	$("#gui_btn_pastebin").click(function() {
		loadPasteBin($("#input_pastebin").val());
	});

	$("#gui_btn_import_file").click(function() {
		import_json();
	});

	$("#gui_btn_import_image").click(function() {
		var url = $("#input_image_url").val();
		if (url) {
			canvas_addImageFromURL(url);
		} else {
			$("#gui_btn_import_image").toggleClass("btn-warning").text("No url!");
			setTimeout(function(){ 
				$("#gui_btn_import_image").toggleClass("btn-warning").text("Import");
			}, 1000);
			return false;
		}
	});

// Start of Load/Save/Import Features
//-----------------------------------------------------------------
// Load Data
	function loadData() {
		var data = JSON.parse($("#textarea_data_input").val());
		clearTextareaInput();
		canvas.clear();
		power_count = 0;
		room_count = 0;
		capacity_count = 0;
		canvas.loadFromDatalessJSON(data, function() {
			canvas.renderAll();
			canvas.getObjects().forEach(function (object) {
				if (object.get('dojo_room')) {
					object.setControlsVisibility({mt: false,mb: false,ml: false,mr: false,tr: false,tl: false,br: false,bl: false,mtr: true});	
				}
			});
			gui_reCalcDojoStats();
			saveData();

			setTimeout(function(){ 
				$('#modal_load').modal('hide');
			}, 1700);
			
		});
	};

// Save Data
	function saveData() {
	  // Get the data we want to save, inc custom fields and canvas boundaries
		var all_objects = canvas.getObjects(),
			a_x_min = parseInt(Math.min.apply(Math, all_objects.map(function(v){return v['aCoords']['tl']['x'];}))),
			a_x_max = parseInt(Math.max.apply(Math, all_objects.map(function(v){return v['aCoords']['br']['x'];}))),
			a_y_min = parseInt(Math.min.apply(Math, all_objects.map(function(v){return v['aCoords']['tl']['y'];}))),
			a_y_max = parseInt(Math.max.apply(Math, all_objects.map(function(v){return v['aCoords']['br']['y'];}))),
			o_x_min = parseInt(Math.min.apply(Math, all_objects.map(function(v){return v['oCoords']['tl']['x'];}))),
			o_x_max = parseInt(Math.max.apply(Math, all_objects.map(function(v){return v['oCoords']['br']['x'];}))),
			o_y_min = parseInt(Math.min.apply(Math, all_objects.map(function(v){return v['oCoords']['tl']['y'];}))),
			o_y_max = parseInt(Math.max.apply(Math, all_objects.map(function(v){return v['oCoords']['br']['y'];}))),
			customProperties = ['dojo_power', 'dojo_room', 'dojo_cap'],
			max_d = 4096;
		console.log("Clem walks the perimeter: ",a_x_min, a_x_max, a_y_min, a_y_max);

	  // Export to JSON
		var json_data = JSON.stringify(canvas.toJSON(customProperties));
		var json_data_uri = "data:text/json;charset=utf-8,"+encodeURIComponent(json_data);
		$("#textarea_data").text(json_data);
		$("#gui_btn_download_json").attr("href", json_data_uri);
		$("#gui_btn_download_json").attr("download", "dojo_layout.json");

	  // Export to SVG
		var svg_data = canvas.toSVG({
			viewBox: {
				x: 0 + a_x_min,
				y: 0 + a_y_min,
				width: a_x_max - a_x_min,
				height: a_y_max - a_y_min,
			}
		});
		var svg_data_uri = "data:image/svg+xml;charset=utf-8,"+svg_data;
		$("#gui_btn_download_svg").attr("href", svg_data_uri);
		$("#gui_btn_download_svg").attr("download", "dojo_layout.svg");


		var png_data_uri = canvas.toDataURL({
			left: o_x_min,
			top: o_y_min
		});
		$("#gui_btn_download_png").attr("href", png_data_uri);
		$("#gui_btn_download_png").attr("download", "dojo_layout.png");

	  //Reset "copy" button
		if ($("#gui_btn_copy_data").hasClass("btn-success")) {
			$("#gui_btn_copy_data").toggleClass("btn-primary btn-success");
			$("#gui_btn_copy_data").text('Copy');
		}
	};

// Load a pastebin
	function loadPasteBin(url) {
		var paste = url.split('/').pop();
		var fetch = "https://pastebin.com/raw/"+paste;
		if (paste.length!==8) {
			pastebinMessage(0, "Error! Couldn't find a valid Pastebin", paste);
			console.log("Clem cant paste with ",paste);
		} else {
			console.log("Clem tries to paste "+paste);
			$.ajax({
				url: fetch,
				dataType: 'json',
				success: function(data) {
					console.log("Clem is victorious. ",data)
					pastebinMessage(1, "Copied!", paste);
					var json_data = JSON.stringify(data);
					$("#textarea_data_input").val(json_data);
					loadData();
				},
				error: function(data, status, errror) {
					console.log("Clem fails. "+status+" | ",data);
					var msg = "There was a problem getting the paste, usually due to CORS. Try saving the paste as a json file and uploading it.";
					pastebinMessage(0, msg, paste);
				}
			})
		}
	}

// Watch file upload to import json
	$("#input_json_file").change(function(){
		var reader = new FileReader();
		reader.onload = function(e) {
			$("#textarea_data_input").val(reader.result);
			console.log("Once upon a Clem...", reader.result);
			ga('send', 'event', 'Shares', 'Load', 'JSON');
			setTimeout(function(){ 
				loadData();
			}, 500);
		}		
		var file = $("#input_json_file").prop("files")[0];
		reader.readAsText(file);
	});

// Watch file upload to import image
	$("#input_image_file").change(function(){
		var reader = new FileReader();
		reader.onload = function(e) {
			var img = new Image();
			img.src = e.target.result;
			img.onload = function() {
				canvas_addImageFromSrc(img);
				console.log("Clem has uncovered an artefact...", img);
			}
		}
		var file = $("#input_image_file").prop("files")[0];
		reader.readAsDataURL(file);
	});

// Misc Functions
//-----------------------------------------------------------------
// Get an array or URL params
	function getUrlVars() {
		var vars = [], hash;
		var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
		for(var i = 0; i < hashes.length; i++) {
			hash = hashes[i].split('=');
			vars.push(hash[0]);
			vars[hash[0]] = hash[1];
		}
		return vars;
	}

// Check for autoload of Pastebin
	if (getUrlVars()["pastebin"]) {
		pastebin_id = getUrlVars()["pastebin"];
	} else if (getUrlVars()["p"]) {
		pastebin_id = getUrlVars()["p"];
	}
	if (pastebin_id) {
		console.log("Clem fetches "+getUrlVars()["p"]);
		loadPasteBin(getUrlVars()["p"]);
		clean_slate = false;
		ga('send', 'event', 'Shares', 'Load', 'Pastebin');
	}

// Preload images
	function preloadImages() {
		tiles.forEach(function(tile) {
			$('<img/>')[0].src = tile[0];
		});
	}

// Start the music
//-----------------------------------------------------------------
// Lets dance
	$(function () {
		console.log(" __   \n(_  _ \n__)(_) began the tale of Clem the Mighty...");
		// Setup the GUI
		gui_addNavbarCategories();
		gui_addNavbarTiles();
		gui_addNavbarIcons();
		$('[data-placement="bottom"]').tooltip();

		// Zoom out one level
		var point = new fabric.Point(canvas_width / 2, canvas_height / 2);
		zoomOut(point);

		// Show the instructions, unless loading a map
		if (clean_slate) {
			// Casual banter
			$("#modal_instructions").modal("show");
			canvas_addTile(0, ((canvas_width/2)-(tiles[0][3]/2)), ((canvas_height/2)-(tiles[0][4]/2)));
		}
	});