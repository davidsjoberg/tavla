export {scale_expand};

function scale_expand(range_array, mult) {
    let domain = (range_array[1] - range_array[0])
    return [range_array[0]-domain*mult, range_array[1]+domain*mult]
  }

