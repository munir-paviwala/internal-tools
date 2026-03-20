# Internal Tools -> Research & Interactives

This repository houses a suite of custom-built, interactive geospatial dashboards and data visualizations designed for specialized research. The tools primarily focus on mapping energy and industrial infrastructure across India, ranging from a national level to specialized regional use cases.

## Author & Credits
Created for internal research use cases. Directed by **Munir Paviwala** in collaboration with Google Gemini.

## Included Projects

The repository is built around three core interactive applications:

### 1. OGIM India Explorer (`ogim_india.html`)
An interactive geospatial dashboard that maps the vast oil and gas infrastructure across India, including its offshore Exclusive Economic Zone (EEZ).
- **Core Features**: Toggleable data layers for pipelines, fields, blocks, and refineries. Includes a high-resolution map export widget.
- **Data Source**: Uses the *Oil and Gas Infrastructure Mapping (OGIM) v2.7* dataset authored by the Environmental Defense Fund (EDF) and MethaneSAT (doi:10.5281/zenodo.15103476).
- **Tech Stack**: Leaflet.js, Leaflet.markercluster.

### 2. Indian Oil Refineries Timetable (`oil_refineries_interactive.html`)
A geocoded timeline visualization illustrating the historic expansion of India's oil refineries.
- **Core Features**: An interactive chronological slider allowing users to see when and where refineries were established from 1901 extending into future planned expansions (2024+). Custom monochrome styling mimics a physical black-and-white research document.
- **Tech Stack**: Vanilla Leaflet.js.

### 3. Baroda Industrial Mapping (`mapping_Baroda_industrial.html`)
A focused map visualizer and lightweight spatial editor mapping industrial estates and plants within the Baroda (Vadodara) region.
- **Core Features**: In addition to a 'View Mode', the interactive includes an editor allowing users to place new industrial markers, physically drag locations, adjust labels to mitigate overlap, and export their updated spatial data configuration as a JSON payload right from the UI.
- **Tech Stack**: Leaflet.js atop Esri World Imagery maps.


