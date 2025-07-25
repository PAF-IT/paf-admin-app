<script>
    import {logout, role, settings, version} from "../stores/api"
    import {navigateTo, navigation} from "../stores/navigation"


    let appUpdate = false

    $: appUpdate = $settings.app_version !== version

    function update() {
        appUpdate = false
        location.reload()
    }

    async function handleLogout() {
        await logout()
    }
</script>

<div uk-sticky="sel-target: .uk-navbar-container; cls-active: uk-navbar-sticky; bottom: #transparent-sticky-navbar" class="paf-navi-bg">
    <nav class="uk-navbar-container uk-navbar-transparent" uk-navbar style="position: relative; z-index: 980; box-bottom: solid; border-bottom-color: #080808">
        <div class="uk-navbar-left">
            <a href={"#"} class="uk-navbar-item uk-logo" on:click={() => navigateTo('dashboard')}>
                <img src="/paf-logo.png" width="100" alt="PAF logo"/>
            </a>
        </div>
        <div class="uk-navbar-center uk-visible@m">
            <ul class="uk-navbar-nav">
                <li class:uk-active={$navigation.dashboard}><a href={"#"} on:click={() => navigateTo('dashboard')}>Dashboard</a></li>
                <li class:uk-active={$navigation.booking}><a href={"#"} on:click={() => navigateTo('booking')}>Booking</a></li>
                <li class:uk-active={$navigation.member}><a href={"#"} on:click={() => navigateTo('member')}>Member</a></li>
                <li class:uk-active={$navigation.payment}><a href={"#"} on:click={() => navigateTo('payment')}>Payment</a></li>
                <li class:uk-active={$navigation.invoice}><a href={"#"} on:click={() => navigateTo('invoice')}>Invoice</a></li>
                {#if $role === 'admin' || $role === 'mattress' || $role === 'root'}
                    <li class:uk-active={$navigation.mattress}><a href={"#"} on:click={() => navigateTo('mattress')}>Mattress</a></li>
                {/if}
                <li class:uk-active={$navigation.event}><a href={"#"} on:click={() => navigateTo('event')}>Event</a></li>
            </ul>
        </div>
        <div class="uk-navbar-right">
            <a class="uk-navbar-toggle" uk-navbar-toggle-icon href={"#"}  uk-toggle="target: #offcanvas-nav"> </a>
        </div>
    </nav>
    <div class="uk-flex uk-flex-center">
        <div class="uk-grid-small" uk-grid>
            <div class="uk-width-1-1">
                <div class="uk-align-center" style="border-top: solid black 1.5px; width: 750px;"></div>
            </div>
            {#if appUpdate}
                <div class="uk-width-auto uk-align-center uk-margin-remove-vertical">
                    <div class="uk-alert-warning uk-text-center" uk-alert>
                        <span uk-icon="warning"></span> <a href={"#"} on:click={() => update()}>Please click here to update to the latest version!</a>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>

<div id="offcanvas-nav" uk-offcanvas="overlay: true; flip: true">
    <div class="uk-offcanvas-bar uk-width-small">
        <ul class="uk-nav uk-nav-default uk-hidden@m">
            <li class="uk-nav-header">Admin</li>
            <li class:uk-active={$navigation.dashboard}><a href={"#"} on:click={() => navigateTo('dashboard')}>Dashboard</a></li>
            <li class:uk-active={$navigation.booking}><a href={"#"} on:click={() => navigateTo('booking')}>Booking</a></li>
            <li class:uk-active={$navigation.member}><a href={"#"} on:click={() => navigateTo('member')}>Member</a></li>
            <li class:uk-active={$navigation.payment}><a href={"#"} on:click={() => navigateTo('payment')}>Payment</a></li>
            <li class:uk-active={$navigation.invoice}><a href={"#"} on:click={() => navigateTo('invoice')}>Invoice</a></li>
            {#if $role === 'admin' || $role === 'mattress' || $role === 'root'}
                <li class:uk-active={$navigation.mattress}><a href={"#"} on:click={() => navigateTo('mattress')}>Mattress</a></li>
            {/if}
            <li class:uk-active={$navigation.event}><a href={"#"} on:click={() => navigateTo('event')}>Event</a></li>
            <li>&nbsp;</li>
        </ul>
        <ul class="uk-nav uk-nav-default">
            <li class="uk-nav-header">Lists</li>
            <li class:uk-active={$navigation.reservations}><a href={"#"} on:click={() => navigateTo('reservations')}>Reservations</a></li>
            <li class:uk-active={$navigation.newsletter}><a href={"#"} on:click={() => navigateTo('newsletter')}>Newsletter</a></li>
            {#if $role === 'admin' || $role === 'root'}
                <li class="uk-hidden@m"></li>
                <li class="uk-nav-header">Accounting</li>
                <li class:uk-active={$navigation.accounting}><a href={"#"} on:click={() => navigateTo('accounting')}>Monthly</a></li>
                <li class:uk-active={$navigation.reconciliation}><a href={"#"} on:click={() => navigateTo('reconciliation')}>Reconciliation</a></li>
                <li class:uk-active={$navigation.bankrun}><a href={"#"} on:click={() => navigateTo('bankrun')}>Deposit</a></li>
                <li class:uk-active={$navigation.sci}><a href={"#"} on:click={() => navigateTo('sci')}>SCI</a></li>
                <li class="uk-hidden@m"></li>
                <li class="uk-nav-header">Data</li>
                <li class:uk-active={$navigation.data}><a href={"#"} on:click={() => navigateTo('data')}>Export</a></li>
                {#if $role === 'root'}
                    <li class:uk-active={$navigation.datain}><a href={"#"} on:click={() => navigateTo('datain')}>Import</a></li>
                {/if}
                <li class="uk-hidden@m"></li>
                <li class="uk-nav-header">Settings</li>
                <li class:uk-active={$navigation.settings}><a href={"#"} on:click={() => navigateTo('settings')}>Defaults</a></li>
                {#if $role === 'root'}
                    <li class:uk-active={$navigation.users}><a href={"#"} on:click={() => navigateTo('users')}>Users</a></li>
                {/if}
            {/if}
            <li class="uk-hidden@m"></li>
            <li class="uk-nav-header">Logout</li>
            <li on:click={handleLogout}><a href={"#"}>Logout</a></li>
            <li>&nbsp;</li>
            <li>&nbsp;</li>
            <li>&nbsp;</li>
            <li class="uk-text-small uk-text-meta">User:</li>
            <li class="uk-text-small">{$role}</li>
            <li class="uk-text-small">&nbsp;</li>
            <li class="uk-text-small uk-text-meta">Version:</li>
            <li class="uk-text-small">{version}</li>
        </ul>
    </div>
</div>