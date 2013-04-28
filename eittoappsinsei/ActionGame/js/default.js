(function () {
    "use strict";
    var Application=WinJS.Application;
    var Activation=Windows.ApplicationModel.Activation;
    var ActivationKind=Activation.ActivationKind;
    var ApplicationExecutionState=Activation.ApplicationExecutionState;
    WinJS.strictProcessing();

    //シーン定数(1)
    var S_TITLE   =0;//タイトル
    var S_PLAY    =1;//プレイ
    var S_GAMEOVER=2;//ゲームオーバー
    
    //システム
    var canvas;
    var context;
    var updateTime=0;

    //ゲーム
    var scene;             //シーン(1)
    var init=S_TITLE;      //次のシーン(1)
    var images=new Array();//イメージ
    var score=0;           //スコア
    var touchDown=false;   //タッチダウン
    
    //プレイヤー(3)
    var playerX=160;//X座標
    var playerY;    //Y座標
    var playerVY=0; //Y速度
    var playerHit;  //衝突
    
    //隕石(4)
    var meteoAppear=0;     //出現
    var meteoX=new Array();//X座標
    var meteoY=new Array();//Y座標
    
    //アプリ起動時と再開時に呼ばれる
    Application.onactivated=function(args) {
        if (args.detail.kind===ActivationKind.launch) {
            if (args.detail.previousExecutionState!==
                ApplicationExecutionState.terminated) {
                Application.onlaunched(args);
            }
            args.setPromise(WinJS.UI.processAll());
        }
    };

    //アプリ起動時に呼ばれる
    Application.onlaunched=function(args) {
        //コンテキストの取得
        canvas=$("canvas");
        context=canvas.getContext("2d");

        //コンテキストの初期化
        context.font="42px 'Meiryo UI'";
        context.strokeStyle="rgb(255,255,255)";
        context.fillStyle  ="rgb(255,255,255)";

        //イメージの読み込み
        for (var i=0;i<12;i++) {
            var image=new Image();
            image.src="/images/pic"+i+".png";
            images.push(image);
        }

        //イベントリスナーの追加
        canvas.addEventListener("MSPointerDown",onMSPointerDown);
        canvas.addEventListener("MSPointerUp",onMSPointerUp);
        canvas.addEventListener("MSPointerCancel",onMSPointerCancel);

        //イメージ読み込み待ち
        preload(images,animate);
    }

    //アプリ開始
    Application.start();

    //イメージ読み込み待ち
    function preload(images,onComplete) {
        var loadImages=function() {
            var count=0;
            for(var i=0;i<12;i++) {
                if(images[i].complete) count++;
            }
            if (count<images.length) {
                setTimeout(loadImages,100);
            } else {
                onComplete();
            }
        };
        loadImages();
    }


    //アニメーションフレームのループ処理
    function animate() {
        var currentTime=new Date().getTime();
        if (updateTime<=currentTime) {
            updateTime=currentTime+50-currentTime%50;
            onTick();
        }
        window.msRequestAnimationFrame(animate);
    }

    //定期処理(2)
    function onTick() {
        //シーンの初期化
        if (init>=0) {
            //タイトルの初期化　
            if (init==S_TITLE) {
                playerY=360;
                playerVY=0;
                playerHit=false;
                meteoAppear=0;
                for (var i=0;i<20;i++) meteoY[i]=-1;
            } 
            //プレイの初期化
            else if (init==S_PLAY) {
                score=0;
            } 
            touchDown=false;
            scene=init;
            init=-1;
        }

        //プレイ時の処理
        if (scene==S_PLAY) {
            //プレイヤーの移動(3)
            if (touchDown && !playerHit) {
                playerVY--;
            } else {
                playerVY++;
            }
            playerY+=playerVY;
            if (playerY<-95 || 720+95<playerY) init=S_GAMEOVER;
            
            if (!playerHit) {
                //隕石の移動と出現(4)
                for (var i=0;i<8;i++) {
                    if (meteoY[i]>=0) {
                        meteoX[i]-=5;
                        if (meteoX[i]<-60) meteoY[i]=-1;
                        if (isHit(i)) {
                            playerHit=true;
                            playerVY=10;
                        }
                    } else if (meteoAppear<=0) {
                        meteoX[i]=1280+60;
                        meteoY[i]=rand(720);
                        meteoAppear=rand(30);
                    }
                }
                meteoAppear--;
            
                //スコア加算
                score++;
            }
        }

        //背景の描画
        context.drawImage(images[4],0,0);
        if (scene==S_GAMEOVER) {
            context.drawImage(images[8],500,220);
        }

        //プレイヤーと隕石の描画
        var playerIdx=(playerVY>10)?2:1;
        if (touchDown && !playerHit) playerIdx=0;
        context.drawImage(images[playerIdx],playerX-45,playerY-95);
        for (var i=0;i<20;i++) {
            if (meteoY[i]>=0) {
                context.drawImage(images[3],meteoX[i]-60,meteoY[i]-60);
            }
        }
        
        //タイトルとボタンの描画
        if (scene==S_TITLE) {
            context.drawImage(images[5],250,40);
            context.drawImage(images[6],500,520);
        } else if (scene==S_GAMEOVER) {
            context.drawImage(images[7],210,40);
            context.drawImage(images[9],500,520);
        }
        
        //スコアの描画
        drawScore(score);
    }

    //スコアの描画
    function drawScore(score) {
        if (score>999999) score=999999;
        context.drawImage(images[10],870,10);
        var value=1000000;
        for (var i=0;i<6;i++) {
            value=Math.floor(value/10);
            var num=Math.floor(score/value);
            context.drawImage(images[11],num*40,0,40,50,1030+40*i,10,40,50);
            score-=num*value;
        }
    }


    //隕石との衝突判定
    function isHit(i) {
        return ((playerX-meteoX[i])*(playerX-meteoX[i])+
            (playerY-meteoY[i])*(playerY-meteoY[i]))<90*90;
    }
    
    //乱数の取得
    function rand(num) {
        return parseInt(Math.random()*num);        
    }

    //ポインタダウンイベントの処理
    function onMSPointerDown(event) {
        touchDown=true;
        if (scene==S_TITLE)    init=S_PLAY;
        if (scene==S_GAMEOVER) init=S_TITLE;
    }

    //ポインタアップイベントの処理
    function onMSPointerUp(event) {
        touchDown=false;
    }

    //ポインタキャンセルイベントの処理
    function onMSPointerCancel(event) {
        touchDown=false;
    }

    //要素の取得
    function $(id) {
        return document.getElementById(id);
    }
})();