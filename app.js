// App Configuration & Layer Definitions
const CONFIG = {
    mapCenter: [22.5, 78.5], // Center of India
    zoom: 5,
    layers: [
        { id: 'Crude_Oil_Refineries', name: 'Crude Oil Refineries', color: '#e11d48', url: 'data/Crude_Oil_Refineries_India.geojson' },
        { id: 'Equipment_and_Components', name: 'Equipment & Components', color: '#64748b', url: 'data/Equipment_and_Components_India.geojson' },
        { id: 'Gathering_and_Processing', name: 'Gathering & Processing', color: '#d97706', url: 'data/Gathering_and_Processing_India.geojson' },
        { id: 'Injection_and_Disposal', name: 'Injection & Disposal', color: '#059669', url: 'data/Injection_and_Disposal_India.geojson' },
        { id: 'LNG_Facilities', name: 'LNG Facilities', color: '#10b981', url: 'data/LNG_Facilities_India.geojson' },
        { id: 'Natural_Gas_Compressor_Stations', name: 'Compressor Stations', color: '#0284c7', url: 'data/Natural_Gas_Compressor_Stations_India.geojson' },
        { id: 'Natural_Gas_Flaring_Detections', name: 'Flaring Detections', color: '#ea580c', url: 'data/Natural_Gas_Flaring_Detections_India.geojson' },
        { id: 'Offshore_Platforms', name: 'Offshore Platforms', color: '#2563eb', url: 'data/Offshore_Platforms_India.geojson' },
        { id: 'Oil_Natural_Gas_Pipelines', name: 'Oil & Gas Pipelines', color: '#f59e0b', url: 'data/Oil_Natural_Gas_Pipelines_India.geojson', isLine: true },
        { id: 'Oil_and_Natural_Gas_Basins', name: 'Basins', color: '#4f46e5', url: 'data/Oil_and_Natural_Gas_Basins_India.geojson', isPolygon: true },
        // Notice Fields are separated to color dynamically by well type
        { id: 'Oil_and_Natural_Gas_Fields', name: 'Fields', color: '#0d9488', url: 'data/Oil_and_Natural_Gas_Fields_India.geojson', isPolygon: true, customStyleColor: true },
        { id: 'Oil_and_Natural_Gas_License_Blocks', name: 'License Blocks', color: '#cbd5e1', url: 'data/Oil_and_Natural_Gas_License_Blocks_India.geojson', isPolygon: true },
        { id: 'Oil_and_Natural_Gas_Wells', name: 'Wells', color: '#4338ca', url: 'data/Oil_and_Natural_Gas_Wells_India.geojson' },
        { id: 'Petroleum_Terminals', name: 'Petroleum Terminals', color: '#7c3aed', url: 'data/Petroleum_Terminals_India.geojson' },
        { id: 'Stations_Other', name: 'Other Stations', color: '#94a3b8', url: 'data/Stations_Other_India.geojson' },
        { id: 'Tank_Battery', name: 'Tank Battery', color: '#52525b', url: 'data/Tank_Battery_India.geojson' }
    ]
};

// Global Store
const mapState = {
    map: null,
    layerGroups: {}
};

// Initialize Map
function initMap() {
    mapState.map = L.map('map', {
        zoomControl: false,
        preferCanvas: true
    }).setView(CONFIG.mapCenter, CONFIG.zoom);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> | &copy; OGIM Database',
        subdomains: 'abcd',
        maxZoom: 19,
        crossOrigin: true
    }).addTo(mapState.map);

    L.control.zoom({ position: 'bottomright' }).addTo(mapState.map);
}

// Map popup content generator (Smart NA filtering & Sorting)
function generatePopupContent(feature, layerConfig) {
    const props = feature.properties;
    
    // Ordered priority list of fields
    const priorityKeys = [
        'NAME', 'FAC_NAME', 'PROV_NAME', 'CAPACITY', 'CAPACITY_UNITS', 'RESERVOIR_TYPE', 
        'PRODUCT', 'OPERATOR', 'FAC_STATUS', 'ON_OFFSHORE', 'STATE_PROV', 'REGION'
    ];

    const entries = Object.entries(props).filter(([k, v]) => {
        // Filter out system, redundant, or exact null variables 
        if (k === 'fid' || k === 'geom' || k === 'OGIM_ID' || k === 'SRC_REF_ID') return false;
        if (v === null || v === undefined) return false;
        if (v === 'N/A' || v === -999 || v === '1900-01-01') return false;
        if (typeof v === 'string' && v.trim() === '') return false;
        return true;
    }).sort(([k1], [k2]) => {
        const idx1 = priorityKeys.indexOf(k1);
        const idx2 = priorityKeys.indexOf(k2);
        
        // Both high priority
        if (idx1 !== -1 && idx2 !== -1) return idx1 - idx2;
        // High priority bubbles up
        if (idx1 !== -1) return -1;
        if (idx2 !== -1) return 1;
        
        // De-prioritize Country to bottom
        if (k1 === 'COUNTRY') return 1;
        if (k2 === 'COUNTRY') return -1;
        if (k1 === 'CATEGORY') return 1;
        if (k2 === 'CATEGORY') return -1;
        
        // Alphabetical remainder
        return k1.localeCompare(k2);
    });

    let html = `<h3>${layerConfig.name}</h3><div class="popup-scroll"><table class="popup-table">`;
    entries.forEach(([k, v]) => {
        const label = k.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        html += `<tr><th>${label}</th><td>${v}</td></tr>`;
    });
    html += `</table></div>`;
    return html;
}

// Load and Render Data Layers
async function loadLayers() {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.classList.add('active');
    
    const uiContainer = document.getElementById('layer-toggles');

    for (const layer of CONFIG.layers) {
        try {
            const response = await fetch(layer.url);
            if (!response.ok) continue; // Skip if file doesn't exist
            const data = await response.json();
            
            const featureCount = data.features ? data.features.length : 0;
            if (featureCount === 0) continue;

            // Optional Marker Clustering for deep point sets
            const useClusters = !layer.isLine && !layer.isPolygon && featureCount > 500;
            
            const lLayer = L.geoJSON(data, {
                style: function (feature) {
                    let color = layer.color;
                    
                    // Smart differentiation for Fields (Oil vs Gas vs Other)
                    if (layer.customStyleColor && feature.properties.RESERVOIR_TYPE) {
                        const rtype = feature.properties.RESERVOIR_TYPE.toUpperCase();
                        if (rtype.includes('OIL')) color = '#000000'; // Black for Oil
                        else if (rtype.includes('GAS')) color = '#0284c7'; // Blue for Gas
                        else if (rtype.includes('COAL')) color = '#b45309'; // Brown
                    }

                    return {
                        color: color,
                        fillColor: layer.isPolygon ? color : 'transparent',
                        fillOpacity: layer.isPolygon ? 0.3 : 0,
                        weight: layer.isPolygon ? 1 : 2,
                        opacity: 0.8
                    };
                },
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, {
                        radius: 4,
                        fillColor: layer.color,
                        color: '#fff',
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.9
                    });
                },
                onEachFeature: function (feature, l) {
                    l.bindPopup(generatePopupContent(feature, layer));
                }
            });

            // Apply cluster bounds if point density is exceptionally large
            let renderLayer = lLayer;
            if(useClusters && typeof L.markerClusterGroup !== 'undefined') {
                renderLayer = L.markerClusterGroup({ disableClusteringAtZoom: 12 });
                renderLayer.addLayer(lLayer);
            }

            mapState.layerGroups[layer.id] = renderLayer;

            const label = document.createElement('label');
            label.className = 'layer-toggle';
            label.innerHTML = `
                <input type="checkbox" id="chk-${layer.id}">
                <div class="custom-checkbox" style="border-color: ${layer.color}"></div>
                <span>${layer.name}</span>
                <span class="feature-count">${featureCount}</span>
            `;
            
            // Toggle Logic
            const checkbox = label.querySelector('input');
            checkbox.addEventListener('change', (e) => {
                const customChk = label.querySelector('.custom-checkbox');
                if(e.target.checked) {
                    renderLayer.addTo(mapState.map);
                    customChk.style.backgroundColor = layer.color;
                } else {
                    mapState.map.removeLayer(renderLayer);
                    customChk.style.backgroundColor = 'transparent';
                }
            });

            uiContainer.appendChild(label);
            
            // Auto-enable first layer found just to show something
            if(Object.keys(mapState.layerGroups).length === 1) {
                checkbox.checked = true;
                renderLayer.addTo(mapState.map);
                const customChk = label.querySelector('.custom-checkbox');
                customChk.style.backgroundColor = layer.color;
            }

        } catch(e) {
            console.log(`Layer ${layer.id} could not be loaded:`, e);
        }
    }

    loadingOverlay.classList.remove('active');
}

// Screenshot Export Logic with Dynamic Watermark
function setupExport() {
    document.getElementById('export-btn').addEventListener('click', () => {
        const btn = document.getElementById('export-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Capturing...';
        
        const sidebar = document.getElementById('sidebar');
        const widget = document.querySelector('.attribution-widget');
        const watermark = document.getElementById('export-watermark');
        
        sidebar.style.transform = 'translateX(-100%)';
        if(widget) widget.style.display = 'none';
        watermark.style.display = 'block';
        
        setTimeout(() => {
            html2canvas(document.body, {
                useCORS: true, 
                backgroundColor: null,
                logging: false
            }).then(canvas => {
                sidebar.style.transform = 'translateX(0)';
                if(widget) widget.style.display = 'block';
                watermark.style.display = 'none';
                btn.innerHTML = originalText;

                const link = document.createElement('a');
                link.download = `OGIM_India_Map_${new Date().toISOString().slice(0,10)}.png`;
                link.href = canvas.toDataURL('image/png', 1.0);
                link.click();
            }).catch(err => {
                console.error("Screenshot error", err);
                sidebar.style.transform = 'translateX(0)';
                if(widget) widget.style.display = 'block';
                watermark.style.display = 'none';
                btn.innerHTML = 'Error! Try Again';
                setTimeout(() => { btn.innerHTML = originalText; }, 2000);
            });
        }, 300);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadLayers();
    setupExport();
});
