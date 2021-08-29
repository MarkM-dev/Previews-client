import os
import sys
from distutils.dir_util import copy_tree
import shutil
import json

firefox_dev_proj_dir_name = 'firefox_dev'

def get_version():
    manifest_path = 'temp/manifest.json'

    with open(manifest_path, 'r') as f:
        data = json.load(f)
        return data['version'].replace('.', '')


def replace_strings_for_opera():
    background_path = 'temp/main/background.js'

    with open(background_path, 'r') as f:
        data = f.read()
        data = data.replace('''tpga_browser = 'chrome';''', '''tpga_browser = 'opera';''')
        data = data.replace('https://chrome.google.com/webstore/detail/twitch-previews/hpmbiinljekjjcjgijnlbmgcmoonclah/reviews/', 'https://addons.opera.com/en/extensions/details/twitch-previews/')
        data = data.replace('https://chrome.google.com/webstore/detail/twitch-previews/hpmbiinljekjjcjgijnlbmgcmoonclah/', 'https://addons.opera.com/en/extensions/details/twitch-previews/')

    with open(background_path), 'w') as f:
        f.write(data)


def replace_strings_for_firefox(f_dir):
    manifest_path = f_dir + '/manifest.json'
    background_path = f_dir + '/main/background.js'

    with open(manifest_path, 'r') as f:
        data = f.read()
        data = data.replace(''',"content_security_policy": "script-src 'self' https://www.google-analytics.com; object-src 'self'"''', '')

    with open(manifest_path, 'w') as f:
        f.write(data)

    with open(background_path, 'r') as f:
        data = f.read()
        data = data.replace('''(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){\n''' \
                            '''    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),\n''' \
                            '''    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)\n''' \
                            '''})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');\n''' \
                            '''ga('create', 'UA-134155755-2', 'auto');\n''' \
                            '''ga('set', 'checkProtocolTask', null);\n''' \
                            '''ga('send', 'pageview', 'main');''', '') \

        data = data.replace('''ga('send', 'event', category, action, value);''', '')
        data = data.replace('''tpga_browser = 'chrome';''', '''tpga_browser = 'firefox';''')
        data = data.replace('https://chrome.google.com/webstore/detail/twitch-previews/hpmbiinljekjjcjgijnlbmgcmoonclah/reviews/', 'https://addons.mozilla.org/en-US/firefox/addon/twitchpreviews/')
        data = data.replace('https://chrome.google.com/webstore/detail/twitch-previews/hpmbiinljekjjcjgijnlbmgcmoonclah/', 'https://addons.mozilla.org/en-US/firefox/addon/twitchpreviews/')

    with open(background_path, 'w') as f:
        f.write(data)


def make_firefox_dev_proj():
    if os.path.isdir(firefox_dev_proj_dir_name):
        shutil.rmtree(firefox_dev_proj_dir_name)
    os.mkdir(firefox_dev_proj_dir_name)
    copy_tree('../Twitch-Previews', firefox_dev_proj_dir_name)
    replace_strings_for_firefox(firefox_dev_proj_dir_name)


def build(browser):
    os.mkdir('temp')
    copy_tree('../Twitch-Previews', 'temp')

    if browser == 'chrome':
        pass
    elif browser == 'firefox':
        if os.path.isdir(firefox_dev_proj_dir_name):
            shutil.rmtree(firefox_dev_proj_dir_name)
        replace_strings_for_firefox('temp')
    elif browser == 'opera':
        replace_strings_for_opera()

    output_filename = 'TwitchPreviewsV' + get_version() + '-' + browser
    shutil.make_archive(output_filename, 'zip', 'temp')
    shutil.rmtree('temp')


if len(sys.argv) > 1:
    if sys.argv[1] == firefox_dev_proj_dir_name:
        make_firefox_dev_proj()
    else:
        build(sys.argv[1])
