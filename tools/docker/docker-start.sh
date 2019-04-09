#!/usr/bin/env bash

if [[ "$1" != "eula-accept" ]]; then
  cat << EulaMessage
+-------------------------------------------------------------+
|                          ERROR!                             |
| It seems you did not accept the End User License Agreement. |
|  By running the following line, you agree that you have     |
|    read and accepted the End User License Agreement at      |
|          http://flogo.io/flogo-docker_eula.pdf :            |
|                                                             |
| docker run -it -p 3303:3303 flogo/flogo-docker eula-accept  |
|                                                             |
+-------------------------------------------------------------+
EulaMessage
  cd /flogo-web/flogo-eula && npm run start 2>&1 >/dev/null
  exit 0
fi

yarn --cwd=apps/server start
