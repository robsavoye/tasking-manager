import React, {useLayoutEffect, useState, useCallback}  from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_TOKEN } from '../../config';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = MAPBOX_TOKEN;

export const ProjectsMap = ({
    state,
    state: { mapResults },
    fullProjectsQuery,
    setQuery,
    className
  }) => {

    const mapRef = React.createRef();
    const [map, setMapObj] = useState(null) ;

    const clickOnProjectID = useCallback( (projectIdSearch) =>  setQuery(
        {
        ...fullProjectsQuery,
        page: undefined,
        text: ["#", projectIdSearch].join("")
        },
        "pushIn"
    ), [fullProjectsQuery, setQuery]);

    useLayoutEffect(() => {
        /* May be able to refactor this to just take
         * advantage of useRef instead inside other useLayoutEffect() */
        /* I referenced this initially https://philipprost.com/how-to-use-mapbox-gl-with-react-functional-component/ */
        if (MAPBOX_TOKEN) {
            setMapObj(new mapboxgl.Map({
                container: mapRef.current,
                // style: 'mapbox://styles/mapbox/bright-v9',
                style: 'mapbox://styles/mapbox/streets-v11',
                zoom: 0
            }));
        }

        return () => {
            map && map.remove();
          };
        // eslint-disable-next-line
    }, [])

    useLayoutEffect(() => {
        /* docs: https://docs.mapbox.com/mapbox-gl-js/example/cluster/ */
        const mapboxLayerDefn = () => {
            map.addSource("projects", {
                    type: "geojson",
                    data: mapResults,
                    cluster: true,
                    clusterRadius: 35
            });

            map.addLayer({
                "id": "projectsClusters",
                "filter": ["has", "point_count"],
                "type": "circle",
                'source': "projects",
                "layout": {

                },
                "paint": {
                    "circle-color": "rgba(104,112,127,0.5)",
                    "circle-radius": [
                        "step",
                        ["get", "point_count"],
                        14,
                        10,
                        22,
                        50,
                        30,
                        500,
                        37
                        ]
                }
            });

            map.addLayer({
                id: "cluster-count",
                type: "symbol",
                source: "projects",
                filter: ["has", "point_count"],
                layout: {
                "text-field": "{point_count_abbreviated}",
                "text-font": ["DIN Offc Pro Bold", "Arial Unicode MS Bold"],
                "text-size": 16
                },
                paint: {
                "text-color": "#FFF",
                "text-halo-width": 10,
                "text-halo-blur": 1
                }
            });

            map.addLayer({
                "id": "projects-unclustered-points",
                "type": "symbol",
                'source': "projects",
                'filter': ["!", ["has", "point_count"]],
                "layout": {
                    "icon-image": "marker-15",
                    "text-field": "#{projectId}",
                    "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                    "text-offset": [0, 0.6],
                    "text-anchor": "top"
                },
                "paint": {
                    "text-color": "#d73f3f",
                    "text-halo-width": 1,
                    "text-halo-color": "#68707f"
                }
            })
            map.on('mouseenter', 'projects-unclustered-points', function(e) {
                // Change the cursor style as a UI indicator.
                map.getCanvas().style.cursor = 'pointer';
            })
            map.on('mouseleave', 'projects-unclustered-points', function(e) {
                // Change the cursor style as a UI indicator.
                map.getCanvas().style.cursor = '';
            })

            map.on('click', 'projects-unclustered-points', (e) => {
                const value = e.features && e.features[0].properties && e.features[0].properties.projectId;
                clickOnProjectID(value)
            });
        }

        const someResultsReady = mapResults && mapResults.features && mapResults.features.length > 0;

        const mapReadyProjectsReady = map !== null && map.isStyleLoaded() && map.getSource('projects') === undefined && someResultsReady;
        const projectsReadyMapLoading = map !== null && !map.isStyleLoaded() && map.getSource('projects') === undefined && someResultsReady;

        /* set up style/sources for the map, either immediately or on base load */
        if (mapReadyProjectsReady) {
            mapboxLayerDefn()
        
        } else if (projectsReadyMapLoading ) {
            map.on('load', mapboxLayerDefn);
        }

        /* refill the source on mapResults changes */
        if (map !== null && map.getSource('projects') !== undefined && someResultsReady) {
            map.getSource('projects').setData(mapResults);
        }
    
    },[map, mapResults, clickOnProjectID]);

    return (
        <div 
           id='map'
           className={`vh-100 fr ${className}`}
           ref={mapRef}
           >
        </div>
    )
}