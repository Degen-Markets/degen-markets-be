include .env

deploy:
	npx cdk@latest deploy \
    		Database \
    		ClientApi \
    		WebhookApi \
    		Settlement \
    		--profile ${AWS_PROFILE} \
    		--require-approval never

bootstrap:
	npx cdk@latest bootstrap --profile ${AWS_PROFILE}

trigger_db_migration:
	aws lambda invoke --function-name DbMigration --profile ${AWS_PROFILE} invoke.log

tunnel:
	bash scripts/connect_database.sh