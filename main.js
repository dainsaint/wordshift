import { words } from "./modules/data.js";


let game;

const resetGame = () => {
  game = {
    state: "setup",
    blocks: []
  }
  save();
}

const save = () => {
  localStorage.setItem("game", JSON.stringify(game));
  // states.setup.save?.();
}

const load = () => {

  try {
    game = JSON.parse( localStorage.getItem("game") )
  } catch(e) {
    resetGame();
  }

  if(!game) resetGame();  
}

const random = (array) => {
  return array[ Math.floor(Math.random() * array.length) ];
}

function shuffle(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

const getRow = (y) => {
  return Array.from(document.querySelectorAll(`.game-block--letter[data-y='${y}']:not(.is-fake)`))
    .sort((a, b) => parseInt(a.dataset.x) - parseInt(b.dataset.x))
}

const getColumn = (x) => {
  return Array.from(document.querySelectorAll(`.game-block--letter[data-x='${x}']:not(.is-fake)`))
    .sort((a, b) => parseInt(a.dataset.y) - parseInt(b.dataset.y))
}

const generatePuzzle = () => {
  const top = random(words);
  const left = random(words.filter( x => x[0] == top[0] ));
  const middle = random(words.filter( x => x[0] == left[2] ));
  const bottom = random( words.filter( x => x[0] == left[4]));
  const center = random( words.filter( x => x[0] == top[2] && x[2] == middle[2] && x[4] == bottom[2]))
  const right = random( words.filter( (x) => x[0] == top[4] && x[2] == middle[4] && x[4] == bottom[4]));
  
  return [ top, middle, bottom, left, center, right ];
}


const initGame = (puzzle) => {
  resetGame();
  const [top, middle, bottom, left, center, right] = puzzle;
  const allLetters = [ top, middle, bottom, left[1], left[3], center[1], center[3], right[1], right[3]].join('').split('');
  shuffle(allLetters);
  

  
  game.puzzle = puzzle;

  const gameDiv = document.getElementById("game");
  let x = 0;
  let y = 0;

  allLetters.forEach( letter => {
    const template = document.getElementById("dom-block");
    const container = template.content.cloneNode(true);
    const block = container.querySelector(".game-block");
    block.innerHTML = letter;
    block.dataset.x = x;
    block.dataset.y = y;
    block.dataset.letter = letter;
    game.blocks.push( block );
    gameDiv?.appendChild( block );
    x++;
    if( x > 4 ) {
      x = 0;
      y++;
    }

    if( y == 1 || y == 3) {
      if( x == 1 || x == 3 ) x++;
    }

  })

  const blanks = [
    { x: 1, y: 1 },
    { x: 3, y: 1 },
    { x: 1, y: 3 },
    { x: 3, y: 3 },
  ];

  for( let i = 0; i < 4; i++ ) {
    const template = document.getElementById("dom-block-blank");
    const container = template.content.cloneNode(true);
    const block = container.querySelector(".game-block");
    block.dataset.x = blanks[i].x;
    block.dataset.y = blanks[i].y;
    gameDiv?.appendChild(block);
  }

  layoutBlocks();
  doTheGame();
  
}

const layoutBlock = block => {
  block.style.top = `${block.dataset.y * 100}px`;
  block.style.left = `${block.dataset.x * 100}px`;
}

const layoutBlocks = () => {
  const blocks = document.querySelectorAll(".game-block");
  
  blocks.forEach( block => {
    layoutBlock(block);
    block.classList.remove("is-valid");
  })

  highlightWordsOnBoard();
}

const highlightWordsOnBoard = () => {
  const rows = 
  [ `.game-block--letter[data-y='${0}']`,
    `.game-block--letter[data-y='${2}']`,
    `.game-block--letter[data-y='${4}']`];

  const cols = [
    `.game-block--letter[data-x='${0}']`,
    `.game-block--letter[data-x='${2}']`,
    `.game-block--letter[data-x='${4}']`,
  ];

  const across = rows.map((row) =>
    Array.from(document.querySelectorAll(row))
      .sort((a, b) => parseInt(a.dataset.x) - parseInt(b.dataset.x))
  );

  const down = cols.map((col) =>
    Array.from(document.querySelectorAll(col))
      .sort((a, b) => parseInt(a.dataset.y) - parseInt(b.dataset.y))
  );

  const potentials = [ ...across, ...down ]
  potentials.forEach( potential => {
    const word = potential.map( block => block.dataset.letter ).join('');
    
    const isValid = words.includes(word);
    if( isValid )
      potential.forEach( block => block.classList.add("is-valid" ));
  })


}

const doTheGame = () => {

  document.addEventListener("mousedown", e => {
    const hovered = document.querySelector(".game-block--letter:hover");
    if (!hovered) return;

    const start = {
      x: e.screenX,
      y: e.screenY
    }

    const movement = {
      x: 0,
      y: 0
    }

    let commitToX = false;
    let commitToY = false;

    const gameDiv = document.getElementById("game");
    const template = document.getElementById("dom-block");


    const fakeBlocks = []
    for( let i = 0; i < 20; i ++ ) {
      const container = template.content.cloneNode(true);
      const fakeBlock = container.querySelector(".game-block");
      fakeBlock.classList.add("is-fake", "is-hidden");
      fakeBlocks.push(fakeBlock);
      gameDiv?.appendChild(fakeBlock);
    }

    const move = e => {
      const current = {
        x: e.screenX,
        y: e.screenY,
      };

      const delta = {
        x: current.x - start.x,
        y: current.y - start.y
      }

      if( commitToX ) delta.y = 0;
      if( commitToY ) delta.x = 0;

      if (hovered.dataset.x == 1 || hovered.dataset.x == 3) {
        delta.y = 0;
      }

      if (hovered.dataset.y == 1 || hovered.dataset.y == 3) {
        delta.x = 0;
      }

      movement.x = Math.round(delta.x / 100);
      movement.y = Math.round(delta.y / 100);
      
      const row = getRow(hovered.dataset.y);
      const column = getColumn(hovered.dataset.x);


      if( Math.abs(delta.x) > Math.abs(delta.y) ) {
        movement.y = 0;
        
        if( Math.abs(delta.x) > 5 && !commitToX) {
          commitToX = true;
          
          fakeBlocks.forEach( (block, i) => {
            block.classList.remove("is-hidden");
            block.dataset.y = hovered.dataset.y;
            block.innerHTML = row[ i % 5 ].dataset.letter;
            let x = -10 + i;
            if( x >= 0 ) x += 5;
            block.dataset.x = x;
            layoutBlock(block);
          })

          
        }
          

        column.forEach((block) => {
          block.style.translate = `0px 0px`;
        });

        row.forEach((block) => {
          block.style.translate = `${delta.x}px 0px`;
        });

        fakeBlocks.forEach( (block) => {
          block.style.translate = `${delta.x}px 0px`;
        });


      }

      if (Math.abs(delta.y) > Math.abs(delta.x)) {
        movement.x = 0;

        if (Math.abs(delta.y) > 5 && !commitToY) {
          commitToY = true;

          fakeBlocks.forEach((block, i) => {
            block.classList.remove("is-hidden");
            block.dataset.x = hovered.dataset.x;
            block.innerHTML = column[i % 5].dataset.letter;
            let y = -10 + i;
            if (y >= 0) y += 5;
            block.dataset.y = y;
            layoutBlock(block);
          });
        }

        row.forEach((block) => {
          block.style.translate = `0px 0px`;
        });

        column.forEach((block) => {
          block.style.translate = `0px ${delta.y}px`;
        });

        fakeBlocks.forEach((block) => {
          block.style.translate = `0px ${delta.y}px`;
        });
      }


    }

    const cancel = e => {

      fakeBlocks.forEach( block => block.remove() );
      const row = getRow(hovered.dataset.y);
      const column = getColumn(hovered.dataset.x);

      row.forEach((block) => block.style.translate = `0px 0px`);
      column.forEach((block) => (block.style.translate = `0px 0px`));

      if (movement.x) {

        row.forEach((block) => {
          block.dataset.x = parseInt(block.dataset.x) + movement.x;

          while( parseInt(block.dataset.x) < 0 )
            block.dataset.x = parseInt(block.dataset.x) + 5;

          while (parseInt(block.dataset.x) > 4)
            block.dataset.x = parseInt(block.dataset.x) - 5;
          
        });
      }

      if (movement.y) {
        column.forEach((block) => {
          block.dataset.y = parseInt(block.dataset.y) + movement.y;
          while (parseInt(block.dataset.y) < 0)
            block.dataset.y = parseInt(block.dataset.y) + 5;

          while (parseInt(block.dataset.y) > 4)
            block.dataset.y = parseInt(block.dataset.y) - 5;
        });
      }

      layoutBlocks();

      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", cancel);
    }

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", cancel);

  })

}

const setup = () => {
  let puzzle;

  for( let i = 0; i < 1000; i++ )
  {
    puzzle = generatePuzzle();
    if( puzzle.every( x => typeof(x) == "string") ) {
      console.log( `Generated in ${i} iterations`);
      console.log( puzzle );
      break;
    }
  }

  if( !puzzle )
    console.log("NO GAME");
  else
    initGame( puzzle );
  
}


// resetGame();
setup();
