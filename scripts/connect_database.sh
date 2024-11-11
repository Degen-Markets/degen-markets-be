#!/bin/bash

source .env

# Prompt user to select the database
options=("production" "development")
echo "Select the database you want to connect to:"
select opt in "${options[@]}"
do
  case $opt in
    "production")
      export AWS_REGION="eu-west-1";
      break
      ;;
    "development")
      export AWS_REGION="us-east-1";
      break
      ;;
    *)
      echo "Invalid option. Please try again."
      ;;
  esac
done

echo "Connecting to $opt database..."

bastion_host_ec2_name=$( [ $opt == 'production' ] && echo 'BastionHost' || echo 'DevBastionHost' );

export basti_id=`aws ec2 describe-instances --profile ${AWS_PROFILE} | jq -r '.Reservations[] | .Instances[] | select(.State.Name == "running") | select(.Tags[] | .Key == "Name" and .Value == "'${bastion_host_ec2_name}'" ) | .InstanceId'`
aws ec2-instance-connect send-ssh-public-key \
       --profile ${AWS_PROFILE} \
       --instance-id ${basti_id} \
       --instance-os-user ec2-user \
       --availability-zone `aws ec2 describe-instances --profile ${AWS_PROFILE} | jq -r '.Reservations[] | .Instances[] | select(.State.Name == "running") | select(.Tags[] | .Key == "Name" and .Value == "'${bastion_host_ec2_name}'") | .Placement.AvailabilityZone'` \
       --ssh-public-key file://`echo ~`/.ssh/id_rsa.pub > /dev/null

database_host=$(aws rds describe-db-instances --profile ${AWS_PROFILE} | jq -r '.DBInstances[] | select(.DBName == "degenmarkets") | .Endpoint.Address')
echo "tunnel to database ${database_host} on port: 5541"

aws ssm start-session \
    --target ${basti_id} \
    --profile ${AWS_PROFILE} \
    --document-name AWS-StartPortForwardingSessionToRemoteHost \
    --parameters "{\"host\":[\"${database_host}\"],\"portNumber\":[\"5432\"], \"localPortNumber\":[\"5541\"]}"