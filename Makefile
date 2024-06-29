include .env

# fixes linting
lint_fix:
	npm run lint:fix

# checks linting
lint:
	npm run lint

# deploys the entire backend to AWS
deploy:
	npx cdk@latest deploy \
    		Database \
    		ClientApi \
    		WebhookApi \
    		Settlement \
    		SolanaActionsApi \
    		--profile ${AWS_PROFILE} \
    		--require-approval never

# checks which resources changed
diff:
	npx cdk@latest diff \
			Database \
			ClientApi \
			WebhookApi \
			Settlement \
			SolanaActionsApi \
			--profile ${AWS_PROFILE}

# bootstraps the AWS account (only needs to be done once)
bootstrap:
	npx cdk@latest bootstrap --profile ${AWS_PROFILE}

# triggers the database migration
trigger_db_migration:
	aws lambda invoke --function-name DbMigration --profile ${AWS_PROFILE} invoke.log

# starts a tunnel to the database in AWS on port 5541
tunnel:
	bash scripts/connect_database.sh