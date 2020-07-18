# Make TalkBubble

This is my first blog that written by English without Chinese, thus if there has some mistakes, just figure out  and leave a message, I'm glad to correct the mistake, as the proverb goes Love & Peace.

<!-- more -->

There is a requirement to make talk bubble by CSS in object，just like this:

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20190801185104.png)

To achieve that goal, you first must know `pseudo-element` such as `:before` and `:after` , and  how to use it.

One  simple demo for using `pseudo-element` , the purpose for this demo is  show   the  changes in styles caused by `border` property.

**HTML**

``` html
<div class="talk-bubble"></div>
```

**CSS**

``` css
.talk-bubble {
  margin: 50px auto;
  width: 200px;
  height: 118px;
  border: 1px solid black;
  position: relative;
}

.talk-bubble:before {
  position: absolute;
  content: '';
  width: 0;
  height: 0;
  right: 100%;
  border-top: 15px solid green;
  border-bottom: 15px solid blue;
  border-left: 15px solid yellow;
  border-right: 15px solid purple;
}

.talk-bubble:after {
  position: absolute;
  content: 'fadasfdas';
  width: 0;
  height: 0;
  left: 100%;
}
```

The result presented by the page like this :

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20190801202854.png)

From that image  we can see the result by the `:before` is a square in the left , the side length of the square is `30px` ，if we don't set the property of `border-bottom` , we can see the page under the below:

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20190801203519.png)

so we know the effect of the width of each side. Let's go back to the original question, we can achieve the goal through  these code. 

``` css
  .talk-bubble {
    margin: 50px auto;
    width: 100px;
    height: 100px;
    border: 2px solid black;
    position: relative;
  }

  .talk-bubble:before,
  .talk-bubble:after {
    content: '';
    width: 0;
    height: 0;
    position: absolute;
    left: 100%;
    border: solid transparent;
  }

  .talk-bubble:before {
    border-width: 12px;
    border-left-color: black;
    top: 20px;
  }

  .talk-bubble:after {
    border-width: 10px;
    top: 22px;
    border-left-color: white;
  }
```
