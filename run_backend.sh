set -o xtrace

for port in 01 03 05 07 10 20 50; do
  docker run --rm \
          -v "/$PWD/models:/models/"  \
          -p 127.0.0.1:90${port}:90${port} \
          -e KMP_BLOCKTIME=0 \
          sleepsonthefloor/graphpipe-tf:cpu \
          --model=models/four.minier.0000${port}.pb \
          --listen=0.0.0.0:90${port} &
done

trap ctrl_c INT

function ctrl_c() {
    echo "** Trapped CTRL-C"
    pkill -P $$
}

for job in `jobs -p`
do
    echo $job
    wait $job || let "FAIL+=1"
done
