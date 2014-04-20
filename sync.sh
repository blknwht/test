#!/bin/bash
REPO="cs3"
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ "$DIR" = "/usr/share/install/$REPO" ]; then
	RS=$(rsync --stats -av * / --exclude sync.sh --exclude *.db --exclude config.json --exclude *.log --exclude *.pyc)
	COUNT=$(echo $RS | grep -o -P '(?<=regular files transferred: ).*(?= Total file size:)')
	echo '{"err":0,"popmsg":"Updated '$COUNT' File(s).","files":'$COUNT'}'
else
	echo '{"err":1,"popmsg":"Update Failed.","files":0}'
fi
exit 0
