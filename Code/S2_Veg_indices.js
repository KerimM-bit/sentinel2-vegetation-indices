// -----------------------------------------------
// 1. Define Study Area (replace with your asset)
// -----------------------------------------------
 // <-- change if needed
Map.centerObject(table, 10);
Map.addLayer(table, {}, "Field Plots");

// -----------------------------------------------
// 2. Define Time Range (±5 days from harvest)
// -----------------------------------------------
var startDate = '2020-09-13';
var endDate   = '2020-10-03';

// -----------------------------------------------
// 3. Load and Mask Sentinel-2 L2A with s2cloudless
// -----------------------------------------------
var s2 = ee.ImageCollection("COPERNICUS/S2_SR")
  .filterBounds(table)
  .filterDate(startDate, endDate)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 50));

var s2cloudless = ee.ImageCollection("COPERNICUS/S2_CLOUD_PROBABILITY")
  .filterBounds(table)
  .filterDate(startDate, endDate);

function maskS2Clouds(img) {
  var cloudProb = ee.Image(s2cloudless
    .filter(ee.Filter.eq('system:index', img.get('system:index')))
    .first());
  var mask = cloudProb.lt(40);  // Threshold: < 40% cloud
  return img.updateMask(mask);
}

var s2Masked = s2.map(maskS2Clouds);

// -----------------------------------------------
// 4. Calculate Vegetation Indices
// -----------------------------------------------
function addIndices(img) {
  var ndvi  = img.normalizedDifference(['B8', 'B4']).rename('NDVI');
  var ndmi  = img.normalizedDifference(['B8', 'B11']).rename('NDMI');
  var msavi 
// -----------------------------------------------
// 1. Define Study Area (replace with your asset)
// -----------------------------------------------
 // <-- change if needed
Map.centerObject(table, 10);
Map.addLayer(table, {}, "Field Plots");

// -----------------------------------------------
// 2. Define Time Range (±5 days from harvest)
// -----------------------------------------------
var startDate = '2020-09-13';
var endDate   = '2020-10-03';

// -----------------------------------------------
// 3. Load and Mask Sentinel-2 L2A with s2cloudless
// -----------------------------------------------
var s2 = ee.ImageCollection("COPERNICUS/S2_SR")
  .filterBounds(table)
  .filterDate(startDate, endDate)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 50));

var s2cloudless = ee.ImageCollection("COPERNICUS/S2_CLOUD_PROBABILITY")
  .filterBounds(table)
  .filterDate(startDate, endDate);
}
function maskS2Clouds(img) {
  var cloudProb = ee.Image(s2cloudless
    .filter(ee.Filter.eq('system:index', img.get('system:index')))
    .first());
  var mask = cloudProb.lt(40);  // Threshold: < 40% cloud
  return img.updateMask(mask);
}

var s2Masked = s2.map(maskS2Clouds);

// -----------------------------------------------
// 4. Calculate Vegetation Indices
// -----------------------------------------------
function addIndices(img) {
  var ndvi  = img.normalizedDifference(['B8', 'B4']).rename('NDVI');
  var ndmi  = img.normalizedDifference(['B8', 'B11']).rename('NDMI');
  var msavi = img.expression(
    '((2 * NIR + 1) - sqrt((2 * NIR + 1) ** 2 - 8 * (NIR - RED))) / 2',
    {
      'NIR': img.select('B8'),
      'RED': img.select('B4')
    }).rename('MSAVI');
    
  return img.addBands([ndvi, ndmi, msavi]);
}

var withIndices = s2Masked.map(addIndices);

// -----------------------------------------------
// 5. Create Median Composite of Indices
// -----------------------------------------------
var medianComposite = withIndices.median().clip(table);
Map.addLayer(medianComposite.select('NDVI'), {min: 0, max: 1, palette: ['brown', 'green']}, 'NDVI');

// Set the projection to UTM Zone 38N
var utm = ee.Projection('EPSG:32638');

var projectedNDVI  = medianComposite.select('NDVI').reproject(utm, null, 10);
var projectedNDMI  = medianComposite.select('NDMI').reproject(utm, null, 10);
var projectedMSAVI = medianComposite.select('MSAVI').reproject(utm, null, 10);


// -----------------------------------------------
// 6. Export Each Index to Drive
// -----------------------------------------------

Export.image.toDrive({
  image: projectedNDVI,
  description: 'NDVI_Gakh_2020',
  folder: 'GEE_exports',
  fileNamePrefix: 'ndvi_2020_median',
  region: table.geometry(),
  scale: 10,
  maxPixels: 1e13
});

Export.image.toDrive({
  image: projectedNDMI,
  description: 'NDMI_Gakh_2020',
  folder: 'GEE_exports',
  fileNamePrefix: 'ndmi_2020_median',
  region: table.geometry(),
  scale: 10,
  maxPixels: 1e13
});

Export.image.toDrive({
  image: projectedMSAVI,
  description: 'MSAVI_Gakh_2020',
  folder: 'GEE_exports',
  fileNamePrefix: 'msavi_2020_median',
  region: table.geometry(),
  scale: 10,
  maxPixels: 1e13
});
