import { dirigent } from "./dirigent.js";

// Create a dataset with randomized data
const data = Array.from({length: 1000}, (_, i) => ({
  id: i,
  score: Math.random(),
  category: `Category ${Math.ceil(Math.random() * 5)}`
}));


const instructions = {'bindings' : {"x" : "id", 
                                    "y" : "score",
                                    "text" : "category",
                                    "color" : "category"}, 
                      "data" : data,
                      "layers" : {
                          "layer1" :  {"geom" : "point",
                                       "attributes": {"color" : "grey",
                                                      "size" : 90}},
                          "layer2" :  {"geom" : "point",
                                       "attributes": {"stroke" : "black",
                                                      "size" : 70}},
                          "layer3" :  {"geom" : "text",
                                       "attributes": {"size" : "small"}
                                      }
                        }
                      };

const divid = "#viz";

dirigent(divid, instructions, 700)

// rita(x = "year", y = "profit", text = "Company")
//   .points(fill = "blue")
//   .text()
//   .theme("basic")