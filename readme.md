## 概要
* aws lambdaのローカル開発テンプレート
* 一旦、s3バケット上のgzファイルを取得して、解凍して、中身を出力して、再びアップロード

## 事前準備
* samのインストール。pipするだけ
  https://github.com/awslabs/aws-sam-cli#windows-linux-macos-with-pip-recommended

## 手順
* localstack起動
  * localhost(xhyve)で起動する場合はTMPDIRにマウントできないので`TMPDIR=/private$TMPDIR docker-compose up -d`とすること
  ```
  docker-compose up -d
  ```

* ネットワーク確認（[参考](https://qiita.com/mizue/items/7bd79d868a7df888388c#docker-compose-構成)）
  * compose.ymlのなかでaws_netという名前でネットワーク作ってるので、そのID確認しておく
```
$ docker-network ls
NETWORK ID          NAME                            DRIVER              SCOPE
123456abcdef        bridge                          bridge              local
[AWS_NET_ID]        [CURRENT_DIR_NAME]_aws_net      bridge              local
```

* s3 putObjectイベントの発行とlambda呼び出し
  * lambdaをaws_net上で起動させる
  ```
  sam local generate-event s3 --bucket input-bucket  --key test.gz | sam local invoke --docker-network 1c92626f4ae6 --env-vars env.json --debug-port 5858 SamLocalstackTemplate
  ```

   * もしくは
  ```
  sam local generate-event s3 --bucket input-bucket  --key test.gz | sam local invoke --docker-network $(docker network ls -q -f 'name=[CURRENT_DIR_NAME]_aws_net') --env-vars env.json --debug-port 5858 SamLocalstackTemplate
  ```

* デバッグ（他のエディタ使ってる人はここに追記して）
  1. vscode   
  ![githubのaws-sam-cli#debugging-applications](https://github.com/awslabs/aws-sam-cli/raw/develop/media/sam-debug.gif)
  - launch.json（`address`と`protoco`は自分の環境に合わせて）
  ```
  {
      "version": "0.2.0",
      "configurations": [
          {
              "name": "Attach to SAM Local",
              "type": "node",
              "request": "attach",
              "address": "127.0.0.1", //local
              "address": "192.168.99.100", //docker-machine
              "port": 5858,
              "localRoot": "${workspaceRoot}",
              "remoteRoot": "/var/task",
              "stopOnEntry": false,
              "protocol": "inspector" // >= nodejs v6.3
              "protocol": "legacy" // < nodejs v8.0
          }
      ]
  }
  ```

## その他
* 関数名、ランタイム、イベントを変更したいときは`template.yml`
* 環境変数は`template.yml`と`env.json`で設定してる