const sectionWidth = 350;
const $map = $('.map');
const $numberOfSections = parseInt($map.css('width')) / sectionWidth;
const $windowWidth = parseInt($('.window').css('width'));
const $playerWidth = parseInt($('#player').css('width'));


//***************MAP GENERATOR***************

const obstacleWidth = 80;
const obstacleMinHeight = 60;
const randomizer = 0.3;
let mapObjectTable;
const obstaclePositions = [];


mapObjectTable = Array
    .from({length: $numberOfSections}, (obstacle, index) => {
        if (index !== 0) {
            return {
                position: index * sectionWidth + Math.floor(Math.random() * (sectionWidth - obstacleWidth)) * .8,
                height: Math.floor((Math.random() * 2 + 1)) * obstacleMinHeight
            }
        }
    })
    .filter(obstacle => {
        return (obstacle !== undefined && Math.random() > randomizer)
    });

mapObjectTable.forEach((obstacle, index) => {
    $map
        .append($('<div>')
            .addClass('obstacle')
            .css('left', obstacle.position)
            .css('height', obstacle.height)
        );
    obstaclePositions[index] = [obstacle.position, obstacle.height];
});

//***************PLAYER***************


const player = document.querySelector('#player');
const moveRight = 'ArrowRight';
const moveLeft = 'ArrowLeft';
const jump = 'ArrowUp';
const fall = 'jumpReleased';
const nitro = 'ControlLeft';

let playerPositionX = 0;
let playerPositionY = 0;
let playerSpeedX = 0;
let maxPlayerSpeedX = 0.4;
let playerSpeedY = 0;
let playerAccelerationX = 0.0005;
let playerAccelerationY = 0.0015;
let nitroMultiplication = 1.4;
let nitroPressed = false;
let keyPressed = '';
let keyPressedJump = '';
let time = Date.now();
let stillFalling = false;
let curObsHei = 0;
let curObsPos = 0;

update();

window.addEventListener('keydown', function (event) {
    if (event.code === moveRight || event.code === moveLeft) {
        event.preventDefault();
        keyPressed = event.code;
    }
    if (event.code === jump) {
        event.preventDefault();
        keyPressedJump = event.code;
    }
    if (event.code === nitro) {
        if (!nitroPressed) {
            maxPlayerSpeedX *= nitroMultiplication;
            playerAccelerationX *= nitroMultiplication;
            nitroPressed = true;
        }
    }
});

window.addEventListener('keyup', function (event) {
    if (event.code === moveRight || event.code === moveLeft) {
        event.preventDefault();
        keyPressed = '';
    }
    if (event.code === jump) {
        event.preventDefault();
        keyPressedJump = fall;
    }
    if (event.code === nitro) {
        maxPlayerSpeedX /= nitroMultiplication;
        playerAccelerationX /= nitroMultiplication;
        nitroPressed = false;
    }
});


function moveFwd(dTime) {
    playerSpeedX = Math.min(Math.max(0, playerSpeedX + playerAccelerationX * dTime), maxPlayerSpeedX);
    playerPositionX += playerSpeedX * dTime;
}

function moveBwd(dTime) {
    playerSpeedX = Math.max(Math.min(0, playerSpeedX - playerAccelerationX * dTime), -maxPlayerSpeedX);
    playerPositionX += playerSpeedX * dTime;
}

function moveUp(dTime) {
    playerSpeedY = playerSpeedY + playerAccelerationY * dTime;
    playerPositionY = playerPositionY + playerSpeedY * dTime;
}

function fallDown(dTime) {
    playerSpeedY = playerSpeedY - playerAccelerationY * dTime;
    playerPositionY = playerPositionY + playerSpeedY * dTime;
}

function update() {
    const dTime = Date.now() - time;
    time = Date.now();
    let horizontalCollision = false;
    let verticalCollision = false;
    let oldPlayerPositionX = playerPositionX;

    function checkCollision() {
        obstaclePositions.forEach(obsPos => {
            if (playerPositionX + $playerWidth >= obsPos[0] && playerPositionX <= obsPos[0] + obstacleWidth) {
                horizontalCollision = true;
                curObsPos = obsPos[0];
                curObsHei = obsPos[1];
                if (playerPositionY < obsPos[1]) {
                    verticalCollision = true;
                }
            }
        })
    }

    switch (keyPressed) {

        case moveRight:
            moveFwd(dTime);
            checkCollision();
            if (horizontalCollision && verticalCollision && !stillFalling) {
                playerPositionX = curObsPos - $playerWidth - 1;
            }
            if (!horizontalCollision && curObsHei !== 0) {
                curObsHei = 0;
                keyPressedJump = fall;
            }
            break;
        case moveLeft:
            moveBwd(dTime);
            checkCollision();
            if (horizontalCollision && verticalCollision) {
                playerPositionX = curObsPos + obstacleWidth + 1;
            }
            if (!horizontalCollision && curObsHei !== 0) {
                curObsHei = 0;
                keyPressedJump = fall;
            }
            break;
        default:
            playerSpeedX = 0;
            break;
    }

    switch (keyPressedJump) {
        case jump:
            if (playerSpeedY < .5 && !stillFalling) {
                moveUp(dTime);
            } else {
                keyPressedJump = fall;
                stillFalling = true;
                fallDown(dTime);
                checkCollision();
                if ((playerPositionY + playerSpeedY * dTime) < curObsHei) {
                    playerPositionY = curObsHei;
                    stillFalling = false;
                    keyPressedJump = '';
                }
            }
            break;
        case fall:
            if (playerPositionY > curObsHei) {
                fallDown(dTime);
                stillFalling = true;
                checkCollision();
                if ((playerPositionY + playerSpeedY * dTime) < curObsHei) {
                    playerPositionY = curObsHei;
                    playerSpeedY = 0;
                }

            }
            if (playerPositionY <= curObsHei) {
                if ((!horizontalCollision && curObsHei > 0) || (keyPressed === moveRight && curObsHei > 0 && playerPositionY < curObsHei)) {
                    fallDown(dTime);
                    playerPositionX = oldPlayerPositionX;
                    stillFalling = true;
                    if (playerPositionY < 0) {
                        playerPositionY = 0;
                        stillFalling = false;
                        keyPressedJump = '';
                    }
                } else {
                    playerPositionY = curObsHei;
                    stillFalling = false;
                    keyPressedJump = '';
                }

            }
            break;

        default:
            playerSpeedY = 0;
            break;
    }

    const $mapPositionX = Math.abs(parseInt($map.css('left')));

    if (playerPositionX > $windowWidth / 2 + $mapPositionX) {
        $('.map').css('left', -playerPositionX + $windowWidth / 2)
    } else if (playerPositionX < 0 || playerPositionX < $mapPositionX) {
        playerPositionX = $mapPositionX
    }

    player.style.left = playerPositionX + 'px';
    player.style.bottom = playerPositionY + 'px';
    requestAnimationFrame(update);
}

//***************CLOUDS***************

(function () {
    const cloudMinWidth = 20;
    const cloudRandomizer = .2;
    let mapCloudTable;
    const $sky = $('.sky');

    mapCloudTable = Array
        .from({length: $numberOfSections}, (cloud, index) => {
            return {
                position: index * sectionWidth + Math.floor(Math.random() * sectionWidth),
                width: Math.ceil(Math.random() * 10) * cloudMinWidth,
                marginTop: Math.ceil(Math.random() * 10) * cloudMinWidth,
                zIndex: Math.ceil(Math.random() * 10),
            }
        })
        .filter(cloud => Math.random() > cloudRandomizer)
        .forEach(cloud => {
            $sky
                .append($('<div>')
                    .addClass('cloud')
                    .css({
                        'margin-left': cloud.position,
                        'margin-top': cloud.marginTop,
                        'width': cloud.width,
                        'height': cloud.width * .44,
                        'z-index': cloud.zIndex
                    })
                )
        });
})();
