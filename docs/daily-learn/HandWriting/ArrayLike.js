// 类数组转换
function arrayLikeTransfer(argument) {
  const result1 = Array.from(argument)
  console.log(result1)

  const result2 = Array.prototype.slice.call(argument)
  console.log(result2)

  const result3 = []
  for (let i = 0; i < argument.length; i++) {
    result3.push(argument[i])
  }
  console.log(result3)

  if (typeof argument[Symbol.iterator] !== 'function') {
    argument[Symbol.iterator] = function* () {
      for (let i = 0; i < this.length; i++) {
        yield this[i]
      }
    }
  }
  const result4 = [...argument]
  console.log(result4)
}

const arrLike1 = {
  length: 3,
  0: 'name',
  1: 'age',
  2: 'gender',
}

arrayLikeTransfer(arrLike1)

const arrLike2 = {
  length: 2,
  0: 1,
  1: 2,
  [Symbol.iterator]() {
    return {
      length: this.length,
      values: Object.values(this),
      i: 0,
      next() {
        while (this.i < this.length) {
          return { done: false, value: this.values[this.i++] }
        }
        return { done: true }
      }
    }
  }
}
arrayLikeTransfer(arrLike2)