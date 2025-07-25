<script>
    import {createEventDispatcher, onMount} from "svelte"
    import {screenWidthL, screenWidthS} from "../stores/navigation"
    import {createForm} from "svelte-forms-lib"
    import * as yup from "yup"
    import UIkit from "uikit"
    import {deleteUser, getUsers, registerUser} from "../stores/user"
    import {passwordStrengthMeter} from '../pswmeter.js'

    let users = []
    let okPassword = true
    let myPassMeter = null

    $: $form && checkPwdStrength()

    const dispatch = createEventDispatcher()

    const { form, errors, touched, state, isValid, handleChange, handleSubmit } = createForm({
        initialValues: {
            user: '',
            password: '',
            role: ''
        },
        onSubmit: () => save(),
        validationSchema: yup.object().shape({
            user: yup.string().min(3).required(),
            password: yup.string().min(12).required(),
            role: yup.string().min(5).required()
        })
    })

    onMount(async () => {
        users = await getUsers()
        myPassMeter = passwordStrengthMeter({
            containerElement: '#pswmeter',
            passwordInput: '#psw-input',
            pswMinLength: 12
        })
    })

    function dispatchReload() {
        dispatch('message', {
            reload: 'users'
        })
    }

    function checkPwdStrength() {
        if (myPassMeter !== null)
            okPassword =  myPassMeter.getScore() === 4
    }

    function cancel() {
        $form.user = ''
        $form.password = ''
        $form.role = ''
    }

    async function save() {
        if (users.find(u => u.user === $form.user)){
            alert('User ' + $form.user + ' already exists, please choose another name!')
            return
        }
        alert('Please note down the password for ' + $form.user + ': ' + $form.password)
        let success = await registerUser($form)
        if (success)
            UIkit.notification('<span uk-icon="icon: check"></span> User registered!', {status:'success', pos: 'bottom-center'})
        else
            UIkit.notification('<span uk-icon="icon: warning"></span> Failed!', {status: 'danger', pos: 'bottom-center'})
        dispatchReload()
    }

    async function deleteMe(user) {
        if (users.length > 1) {
            if (user !== null && user.id !== null && confirm('Are you sure to delete user ' + user.user + '?')) {
                let success = await deleteUser(user.id)
                if (success)
                    UIkit.notification('<span uk-icon="icon: check"></span> User deleted!', {status: 'success', pos: 'bottom-center'})
                else
                    UIkit.notification('<span uk-icon="icon: warning"></span> Failed!', {status: 'danger', pos: 'bottom-center'})
                dispatchReload()
            }
        } else
            alert('You cannot delete the single last user.')
    }
</script>

<div class="uk-flex uk-flex-center">
    <div class="uk-section uk-section-xsmall uk-margin-medium-top uk-margin-bottom uk-width-2-3@m uk-width-5-6">
        <h4 class="uk-heading-small uk-heading-divider uk-text-light uk-margin-medium-bottom uk-width-1-1">User management</h4>
        <div class="uk-margin-medium">
            <form class="uk-form" class:uk-form-horizontal={!$screenWidthL} on:submit={handleSubmit}>
                <label class="uk-form-label" for="form-personals">New user</label>
                <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-personals" uk-grid>
                    <div class="uk-width-1-3@s">
                        <input class="uk-input uk-form-width-large" id="form-user-no1pw-search" name="user" type="text" placeholder="User" autocomplete="'off"
                               class:uk-form-danger={$errors.user && $touched.user} style="color: black"
                               on:keyup={handleChange} on:blur={handleChange} bind:value={$form.user}>
                    </div>
                    <div class="uk-width-1-3@s">
                        <select class="uk-select" id="form-role" name="role" type="text" on:change={handleChange}
                                class:uk-form-danger={$errors.role && $touched.role}>
                            <option value="0" selected>Select role</option>
                            <option value="booking">Booking</option>
                            <option value="admin">Administrator</option>
                            <option value="mattress">Mattress</option>
                        </select>
                    </div>
                    <div class="uk-width-1-3@s">
                        <button class="uk-button uk-margin-large-left" id="submit" type="submit"
                                disabled={!$isValid || !okPassword} class:uk-button-primary={$isValid && okPassword}>Create</button>
                    </div>
                    <div class="uk-width-1-3@s">
                        <input class="uk-input" id="psw-input" name="password" type="text" placeholder="Password" autocomplete="'off"
                               class:uk-form-danger={!okPassword || ($errors.password && $touched.password)} style="color: black"
                               on:keyup={handleChange} on:blur={handleChange} bind:value={$form.password}>
                    </div>
                    <div class="uk-width-2-3@s"> </div>
                    <div class="uk-width-1-3@s uk-padding-small-left uk-margin-small-top uk-margin-small-bottom">
                        <div id="pswmeter"></div>
                    </div>
                    <div class="uk-width-1-1 uk-margin-remove-top uk-text-meta">Passwords are required to have at least: one lowercase character, one uppercase character, one numeric character and a length of 12 characters. Use a password manager when in doubt.</div>
                    <div class="uk-width-1-1"><b>Note</b>: When creating a new user, make sure to <i>record the credentials/password safely</i>, it cannot ever be displayed again afterwards!</div>
                </div>
            </form>
        </div>
        <div class="uk-margin-large-top">
            {#if users.length === 0}
                Loading Users...
            {:else }
                <table class="uk-table uk-table-striped uk-table-hover uk-table-small uk-text-small">
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th class="uk-table-shrink">Delete</th>
                    </tr>
                    </thead>
                    <tbody>
                    {#each users as user}
                        <tr>
                            <td class="uk-text-nowrap">{user.user}</td>
                            <td class="uk-text-nowrap">{user.role}</td>
                            <td class="uk-table-shrink"><button on:click={() => deleteMe(user)} class="uk-button uk-button-small uk-button-danger">Delete</button></td>
                        </tr>
                    {/each}
                    </tbody>
                </table>
            {/if}
        </div>
    </div>
</div>