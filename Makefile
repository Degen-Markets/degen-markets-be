# fixes linting
lint_fix:
	npm run lint:fix

# checks linting
lint:
	npm run lint

# deploys the entire backend to AWS
deploy:
	npx cdk deploy \
    		Database \
    		ClientApi \
    		WebhookApi \
    		Settlement \
    		SolanaActionsApi \
    		--require-approval never

# checks which resources changed
diff:
	npx cdk diff \
			Database \
			ClientApi \
			WebhookApi \
			SolanaActionsApi 

# bootstraps the AWS account (only needs to be done once)
bootstrap:
	npx cdk bootstrap 

# triggers the database migration
trigger_db_migration:
	aws lambda invoke --function-name DbMigration invoke.log

# starts a tunnel to the database in AWS on port 5541
tunnel:
	bash scripts/connect_database.sh