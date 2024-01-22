import { dirigent } from "./dirigent.js";

// Create a dataset with randomized data
const data = Array.from({length: 100}, (_, i) => ({
  id: i,
  score: Math.random(),
  hej: Math.random(),
  category: `Category ${Math.ceil(Math.random() * 5)}`
}));

const instructions = {data :      data,
                      bindings : {
                                    x : "id", 
                                    y : "score",
                                    // size : "score",
                                    // color : "category",
                                    text : "category"
                                  //   stroke: "category"
                                   }, 
                      
                      layers :   {

                        layer1 :  
                                          {
                                          geometry : "line",
                                          attributes : {
                                            size: 2,
                                            color: "blue"
                                                        }
                                          },
                                    layer2 :  
                                          {
                                          geometry : "text",
                                          attributes: {
                                                        color : "black"
                                                        }
                                          }
                                   }
                      };


const instructions2 = {
                      "layers" :   {

                        "layer1" :  
                                          {
                                          "layerdata" : data,
                                          "geometry" : "line",
                                          "attributes": {
                                                        'color' : "red",
                                                        'size' : 2
                                                        }
                                          },
                        "layer2" :  
                                          {
                                          "geometry" : "text",
                                          "layerdata" : data,
                                          "scale_functions" : {
                                            "x" : 'adghadhdhadh',
                                            "y" : 'adghadhdhadh',
                                            "color" : 'adghadhdhadh'
                                          },
                                          "attributes": {
                                                        'color' : "black"
                                                        }
                                          }
                                   }
                      };

const divid = "#viz";

dirigent(divid, instructions, 700)

// rita(data, x = "year", y = "profit", text = "Company")
//   .points(fill = "blue")
//   .text()
//   .theme("basic")