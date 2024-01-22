export {small_grid};

function small_grid(A, domain) {
    let middle_pos = []
    for (let i = 0; i < (A.length - 1); i++) {
      let diff = A[i+1]-A[i]
      middle_pos.push(A[i] + diff/2)
    }
    // If extra minor is needed before first major grid line
    if ((A[0] - (middle_pos[0]-A[0])) > domain[0]) {
      middle_pos.unshift(A[0] - (middle_pos[0]-A[0]))
    }
      // If extra minor is needed after last major grid line
    if ((A[A.length-1] + (A[A.length-1] - middle_pos[middle_pos.length-1])) < domain[1]) {
        middle_pos.push(A[A.length-1] + (A[A.length-1] - middle_pos[middle_pos.length-1]))
    }
    return middle_pos
    }
  
