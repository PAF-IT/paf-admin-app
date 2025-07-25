<script>
    import {login, loggedIn} from "../stores/api";

    let user = '';
    let password = '';

    async function handleSubmit() {
        if (user.length > 0 && password.length > 0)
            await login({"user": user, "password": password});
    }
</script>

<div class="uk-section uk-section-muted uk-flex uk-flex-middle uk-animation-fade" uk-height-viewport>
    <div class="uk-margin uk-width-large uk-margin-auto uk-card uk-card-default uk-box-shadow-large">
        <div class="uk-card-body">
            <img src="/paf-header.png" class="uk-align-center" width="240" alt="PAF logo"/>
            {#if $loggedIn.authenticating}
                <div class="uk-flex uk-flex-center">
                    <div class="uk-align-center" uk-spinner="ratio: 3"></div>
                </div>
            {:else}
                <h3 class="uk-card-title uk-text-center uk-margin-remove-top">Welcome back!</h3>
                <form on:submit|preventDefault={handleSubmit}>
                    <div class="uk-margin">
                        <div class="uk-inline uk-width-1-1">
                            <span class="uk-form-icon" uk-icon="icon: user"></span>
                            <input class="uk-input uk-form-large" id="username" type="text" bind:value={user}>
                        </div>
                    </div>
                    <div class="uk-margin">
                        <div class="uk-inline uk-width-1-1">
                            <span class="uk-form-icon" uk-icon="icon: lock"></span>
                            <input class="uk-input uk-form-large" id="password" type="password" bind:value={password}>
                        </div>
                    </div>
                    <div class="uk-margin">
                        <button type="submit" class="uk-button uk-button-primary uk-button-large uk-width-1-1">Login</button>
                    </div>
                </form>
            {/if}
        </div>
    </div>
</div>