import {
  parseScene,
  sceneBackground,
  sceneSize,
  sceneTitle
} from "jayess:canvas";

export function sceneSummary() {
  var scene = parseScene("<canvas w=\"120\" h=\"80\" background=\"#112233\" title=\"Shapes\" layout=\"none\"><group id=\"layer\" position=\"absolute\" layout=\"none\" xy=\"(100,50)\" visible=\"true\"><rectangle id=\"box\" position=\"absolute\" xy=\"(10,20)\" w=\"30\" h=\"40\" fill=\"#ff0000\" outline=\"#00ff00\" outline-thickness=\"2\" outline-opacity=\"0.25\" corners=\"4 5 6 7\" opacity=\"0.5\" padding=\"3\" font-color=\"#abcdef\" font-family=\"default\" font-size=\"7\" line-height=\"9\" letter-spacing=\"1\" word-spacing=\"2\" text-transform=\"uppercase\" text-decoration=\"underline\" text-overflow=\"ellipsis\" overflow=\"auto\" overflow-x=\"hidden\" scrollbar-width=\"3\" scrollbar-color=\"#888888 #f1f1f1\" text-align=\"left top\" rotation=\"0\" clip=\"false\" points=\"(1,2)\" shadow=\"4 5 6 2 rgba(1,2,3,0.5)\" z=\"3\">Jayess</rectangle><ellipse position=\"absolute\" id=\"oval\" xy=\"(1,2)\" w=\"8\" h=\"6\"/><semiellipse position=\"absolute\" x=\"2\" y=\"3\" width=\"8\" height=\"6\"/><triangle position=\"absolute\" x=\"3\" y=\"4\" width=\"10\" height=\"10\" points=\"(0,0), (5,10), (10,0)\"/><capsule position=\"absolute\" x=\"4\" y=\"5\" width=\"12\" height=\"6\"/><line position=\"absolute\" x=\"5\" y=\"6\" points=\"(0,0), (10,10)\" outline=\"#ffffff\"/><pixel position=\"absolute\" x=\"6\" y=\"7\" fill=\"#010203\"/><polyline position=\"absolute\" x=\"7\" y=\"8\" points=\"(0,0), (5,5)\"/><polygon position=\"absolute\" x=\"8\" y=\"9\" points=\"(0,0), (6,0), (3,6)\"/><image position=\"absolute\" x=\"9\" y=\"10\" width=\"16\" height=\"16\" src=\"local.ppm\"/><text position=\"absolute\" x=\"10\" y=\"11\" text=\"Hi\" font-family=\"default\" font-size=\"7\"/></group></canvas>");
  var size = sceneSize(scene);
  var background = sceneBackground(scene);
  var group = scene.shapes[0];
  var rectangle = group.children[0];
  var line = group.children[5];
  var image = group.children[9];
  var text = group.children[10];
  return [
    size.width,
    size.height,
    background.red,
    background.green,
    background.blue,
    sceneTitle(scene),
    scene.root,
    group.kind,
    group.id,
    group.children.length,
    rectangle.kind,
    rectangle.id,
    rectangle.x,
    rectangle.y,
    rectangle.width,
    rectangle.height,
    rectangle.points[0].x,
    rectangle.points[0].y,
    rectangle.fill.red,
    rectangle.outline.green,
    rectangle.outlineThickness,
    rectangle.outlineOpacity,
    rectangle.corners.topLeft,
    rectangle.corners.topRight,
    rectangle.corners.bottomRight,
    rectangle.corners.bottomLeft,
    rectangle.opacity,
    rectangle.padding,
    rectangle.fontColor.red,
    rectangle.fontColor.green,
    rectangle.fontColor.blue,
    rectangle.fontFamily,
    rectangle.fontSize,
    rectangle.textAlignX,
    rectangle.textAlignY,
    rectangle.text,
    rectangle.clip,
    rectangle.z,
    group.children[1].kind,
    group.children[2].kind,
    group.children[3].kind,
    group.children[4].kind,
    line.kind,
    line.points[0].x,
    line.points[1].y,
    group.children[6].kind,
    group.children[7].kind,
    group.children[8].kind,
    image.kind,
    image.src,
    text.kind,
    text.text,
    text.fontFamily,
    text.fontSize,
    rectangle.shadow.offsetX,
    rectangle.shadow.offsetY,
    rectangle.shadow.blurRadius,
    rectangle.shadow.spreadRadius,
    rectangle.shadow.color.red,
    rectangle.shadow.color.green,
    rectangle.shadow.color.blue,
    rectangle.shadow.color.alpha,
    rectangle.lineHeight,
    rectangle.letterSpacing,
    rectangle.wordSpacing,
    rectangle.textTransform,
    rectangle.textDecoration,
    rectangle.textOverflow,
    rectangle.overflow,
    rectangle.overflowX,
    rectangle.overflowY,
    rectangle.scrollbarWidth,
    rectangle.scrollbarColor.thumb.red,
    rectangle.scrollbarColor.track.red
  ];
}

export function invalidForbiddenGeometry() {
  return parseScene("<scene width=\"10\" height=\"10\"><ellipse x=\"1\" y=\"2\" radius-x=\"4\" radius-y=\"5\" /></scene>");
}

export function invalidPoints() {
  return parseScene("<scene width=\"10\" height=\"10\"><polygon points=\"10,10\" /></scene>");
}

export function invalidUnknownElement() {
  return parseScene("<scene width=\"10\" height=\"10\"><button /></scene>");
}

export function invalidUnknownAttribute() {
  return parseScene("<scene width=\"10\" height=\"10\"><rectangle width=\"1\" height=\"1\" radius-top=\"2\" /></scene>");
}

export function invalidMissingRootSize() {
  return parseScene("<scene height=\"10\"><rectangle width=\"1\" height=\"1\" /></scene>");
}

export function invalidShadowAttribute() {
  return parseScene("<scene width=\"10\" height=\"10\"><pixel x=\"1\" y=\"1\" shadow=\"0\" /></scene>");
}

export function invalidXyAttribute() {
  return parseScene("<scene width=\"10\" height=\"10\"><pixel xy=\"1,1\" /></scene>");
}

export function responsiveSummary() {
  var scene = parseScene("<scene width=\"200\" height=\"100\"><group id=\"layout\" position=\"absolute\" x=\"10\" y=\"10\" width=\"180\" height=\"80\" layout=\"row\" padding=\"10\" gap=\"5\" align=\"center\"><rectangle id=\"a\" width=\"25%\" height=\"20\"/><rectangle id=\"b\" width=\"30\" height=\"50%\"/><rectangle id=\"abs\" position=\"absolute\" right=\"10\" bottom=\"5\" width=\"20\" height=\"10\"/></group><rectangle id=\"fixed\" position=\"fixed\" right=\"5\" bottom=\"6\" width=\"10\" height=\"8\"/><rectangle id=\"clamped\" width=\"80\" max-width=\"50\" height=\"10\" min-height=\"12\"/></scene>");
  var layout = scene.shapes[0];
  var a = layout.children[0];
  var b = layout.children[1];
  var abs = layout.children[2];
  var fixed = scene.shapes[1];
  var clamped = scene.shapes[2];
  return [
    layout.layout,
    layout.padding,
    layout.gap,
    a.position,
    a.x,
    a.y,
    a.width,
    a.height,
    b.x,
    b.y,
    b.width,
    b.height,
    abs.position,
    abs.x,
    abs.y,
    fixed.x,
    fixed.y,
    clamped.width,
    clamped.height
  ];
}

export function defaultFlowSummary() {
  var scene = parseScene("<scene width=\"100\" height=\"80\" padding=\"5\" gap=\"3\"><rectangle id=\"first\" width=\"20\" height=\"10\"/><rectangle id=\"second\" width=\"30\" height=\"12\"/></scene>");
  return [
    scene.shapes[0].position,
    scene.shapes[0].x,
    scene.shapes[0].y,
    scene.shapes[1].position,
    scene.shapes[1].x,
    scene.shapes[1].y
  ];
}

export function defaultTextOverflowSummary() {
  var scene = parseScene("<scene width=\"80\" height=\"40\"><rectangle width=\"20\" height=\"10\">Long text</rectangle></scene>");
  return scene.shapes[0].textOverflow;
}
